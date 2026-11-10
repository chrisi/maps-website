/**
 * Copyright (c) 2010, Jason Davies.
 *
 * All rights reserved.  This code is based on Bradley White's Java version,
 * which is in turn based on Nicholas Yue's C++ version, which in turn is based
 * on Paul D. Bourke's original Fortran version.  See below for the respective
 * copyright notices.
 *
 * See http://paulbourke.net/papers/conrec for the original
 * paper by Paul D. Bourke.
 *
 * The vector conversion code is based on http://apptree.net/conrec.htm by
 * Graham Cox.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Copyright (c) 1996-1997 Nicholas Yue
 *
 * This software is copyrighted by Nicholas Yue. This code is based on Paul D.
 * Bourke's CONREC.F routine.
 *
 * The authors hereby grant permission to use, copy, and distribute this
 * software and its documentation for any purpose, provided that existing
 * copyright notices are retained in all copies and that this notice is
 * included verbatim in any distributions. Additionally, the authors grant
 * permission to modify this software and its documentation for any purpose,
 * provided that such modifications are not distributed without the explicit
 * consent of the authors and that existing copyright notices are retained in
 * all copies. Some of the algorithms implemented by this software are
 * patented, observe all applicable patent law.
 *
 * IN NO EVENT SHALL THE AUTHORS OR DISTRIBUTORS BE LIABLE TO ANY PARTY FOR
 * DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT
 * OF THE USE OF THIS SOFTWARE, ITS DOCUMENTATION, OR ANY DERIVATIVES THEREOF,
 * EVEN IF THE AUTHORS HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * THE AUTHORS AND DISTRIBUTORS SPECIFICALLY DISCLAIM ANY WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.  THIS SOFTWARE IS
 * PROVIDED ON AN "AS IS" BASIS, AND THE AUTHORS AND DISTRIBUTORS HAVE NO
 * OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR
 * MODIFICATIONS.
 */

import type {Point2D} from "@/model/base.ts";

export interface ContourNode {
  p: Point2D
  prev?: ContourNode | null
  next?: ContourNode | null
}

export interface Sequence {
  head: ContourNode
  tail: ContourNode
  prev?: Sequence | null
  next?: Sequence | null
  closed?: boolean
}

export interface ContourPath extends Array<Point2D> {
  level: number
  k: number
}

export type DrawContourCallback = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  contourLevel: number,
  k: number
) => void

const EPSILON = 1e-20

function pointsEqual(a: Point2D, b: Point2D): boolean {
  const x = a.x - b.x
  const y = a.y - b.y
  return x * x + y * y < EPSILON
}

function reverseList(list: Sequence): void {
  let pp: ContourNode | null | undefined = list.head

  while (pp) {
    // swap prev/next pointers
    const temp: ContourNode | null | undefined = pp.next
    pp.next = pp.prev
    pp.prev = temp

    // continue through the list
    pp = temp
  }

  // swap head/tail pointers
  const temp = list.head
  list.head = list.tail
  list.tail = temp
}

export class ContourBuilder {
  public level: number
  public s: Sequence | null = null
  public count: number = 0

  constructor(level: number) {
    this.level = level
  }

  public remove_seq(list: Sequence): void {
    // if list is the first item, static ptr s is updated
    if (list.prev) {
      list.prev.next = list.next
    } else {
      this.s = list.next ?? null
    }

    if (list.next) {
      list.next.prev = list.prev
    }
    --this.count
  }

  public addSegment(a: Point2D, b: Point2D): void {
    let ss: Sequence | null = this.s
    let ma: Sequence | null = null
    let mb: Sequence | null = null
    let prependA = false
    let prependB = false

    while (ss) {
      if (ma == null) {
        // no match for a yet
        if (pointsEqual(a, ss.head.p)) {
          ma = ss
          prependA = true
        } else if (pointsEqual(a, ss.tail.p)) {
          ma = ss
        }
      }
      if (mb == null) {
        // no match for b yet
        if (pointsEqual(b, ss.head.p)) {
          mb = ss
          prependB = true
        } else if (pointsEqual(b, ss.tail.p)) {
          mb = ss
        }
      }
      // if we matched both no need to continue searching
      if (mb != null && ma != null) {
        break
      } else {
        ss = ss.next ?? null
      }
    }

    // c is the case selector based on which of ma and/or mb are set
    const c = ((ma != null) ? 1 : 0) | ((mb != null) ? 2 : 0)

    switch (c) {
      case 0: { // both unmatched, add as new sequence
        const aa: ContourNode = { p: a, prev: null, next: null }
        const bb: ContourNode = { p: b, prev: null, next: null }
        aa.next = bb
        bb.prev = aa

        // create sequence element and push onto head of main list. The order
        // of items in this list is unimportant
        ma = { head: aa, tail: bb, next: this.s, prev: null, closed: false }
        if (this.s) {
          this.s.prev = ma
        }
        this.s = ma

        ++this.count // not essential - tracks number of unmerged sequences
        break
      }

      case 1: { // a matched, b did not - thus b extends sequence ma
        if (!ma) {
          break
        }
        const pp: ContourNode = { p: b, prev: null, next: null }

        if (prependA) {
          pp.next = ma.head
          pp.prev = null
          ma.head.prev = pp
          ma.head = pp
        } else {
          pp.next = null
          pp.prev = ma.tail
          ma.tail.next = pp
          ma.tail = pp
        }
        break
      }

      case 2: { // b matched, a did not - thus a extends sequence mb
        if (!mb) {
          break
        }
        const pp: ContourNode = { p: a, prev: null, next: null }

        if (prependB) {
          pp.next = mb.head
          pp.prev = null
          mb.head.prev = pp
          mb.head = pp
        } else {
          pp.next = null
          pp.prev = mb.tail
          mb.tail.next = pp
          mb.tail = pp
        }
        break
      }

      case 3: { // both matched, can merge sequences
        // if the sequences are the same, do nothing, as we are simply closing this path (could set a flag)
        if (!ma || !mb) {
          break
        }

        if (ma === mb) {
          const pp: ContourNode = { p: ma.tail.p, next: ma.head, prev: null }
          ma.head.prev = pp
          ma.head = pp
          ma.closed = true
          break
        }

        // there are 4 ways the sequence pair can be joined. The current setting of prependA and
        // prependB will tell us which type of join is needed. For head/head and tail/tail joins
        // one sequence needs to be reversed
        switch ((prependA ? 1 : 0) | (prependB ? 2 : 0)) {
          case 0: // tail-tail
            // reverse ma and append to mb
            reverseList(ma)
          // falls through to head/tail case
          case 1: // head-tail
            // ma is appended to mb and ma discarded
            mb.tail.next = ma.head
            ma.head.prev = mb.tail
            mb.tail = ma.tail

            // discard ma sequence record
            this.remove_seq(ma)
            break

          case 3: // head-head
            // reverse ma and append mb to it
            reverseList(ma)
          // falls through to tail/head case
          case 2: // tail-head
            // mb is appended to ma and mb is discarded
            ma.tail.next = mb.head
            mb.head.prev = ma.tail
            ma.tail = mb.tail

            // discard mb sequence record
            this.remove_seq(mb)
            break
        }
        break
      }
    }
  }
}

/**
 * Implements CONREC.
 *
 * @param drawContour function for drawing contour. Defaults to a
 *                    custom "contour builder", which populates the
 *                    contours property.
 */
export class Conrec {
  public contours: Record<number, ContourBuilder> = {}
  public drawContour: DrawContourCallback

  private h: number[] = new Array(5).fill(0)
  private sh: number[] = new Array(5).fill(0)
  private xh: number[] = new Array(5).fill(0)
  private yh: number[] = new Array(5).fill(0)

  constructor(drawContour?: DrawContourCallback) {
    if (!drawContour) {
      this.contours = {}
      /**
       * drawContour - interface for implementing the user supplied method to
       * render the contours.
       *
       * Draws a line between the start and end coordinates.
       *
       * @param startX - start coordinate for X
       * @param startY - start coordinate for Y
       * @param endX - end coordinate for X
       * @param endY - end coordinate for Y
       * @param contourLevel - Contour level for line.
       * @param k - index of contour level
       */
      this.drawContour = (
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        contourLevel: number,
        k: number
      ): void => {
        let cb = this.contours[k]
        if (!cb) {
          cb = this.contours[k] = new ContourBuilder(contourLevel)
        }
        cb.addSegment({ x: startX, y: startY }, { x: endX, y: endY })
      }
    } else {
      this.drawContour = drawContour
    }
  }

  public contourList(): ContourPath[] {
    const l: ContourPath[] = []
    const a = this.contours
    for (const k in a) {
      const cb = a[k]
      if (!cb) {
        continue
      }
      let s: Sequence | null | undefined = cb.s
      const level = cb.level
      while (s) {
        let h: ContourNode | null | undefined = s.head
        const l2 = [] as unknown as ContourPath
        l2.level = level
        l2.k = Number(k)
        while (h && h.p) {
          l2.push(h.p)
          h = h.next
        }
        l.push(l2)
        s = s.next
      }
    }
    l.sort((a, b) => b.k - a.k)
    return l
  }

  /**
   * contour is a contouring subroutine for rectangularily spaced data
   *
   * It emits calls to a line drawing subroutine supplied by the user which
   * draws a contour map corresponding to real*4data on a randomly spaced
   * rectangular grid. The coordinates emitted are in the same units given in
   * the x() and y() arrays.
   *
   * Any number of contour levels may be specified but they must be in order of
   * increasing value.
   *
   * @param d - matrix of data to contour
   * @param ilb - index bounds of data matrix
   * @param iub - index bounds of data matrix
   * @param jlb - index bounds of data matrix
   * @param jub - index bounds of data matrix
   * @param x - data matrix column coordinates
   * @param y - data matrix row coordinates
   * @param nc - number of contour levels
   * @param z - contour levels in increasing order.
   */
  public contour(
    d: number[][],
    ilb: number,
    iub: number,
    jlb: number,
    jub: number,
    x: number[],
    y: number[],
    nc: number,
    z: number[]
  ): void {
    const h = this.h
    const sh = this.sh
    const xh = this.xh
    const yh = this.yh
    const drawContour = this.drawContour
    this.contours = {}

    /** private */
    const xsect = (p1: number, p2: number): number => {
      const hp1 = h[p1] ?? 0
      const hp2 = h[p2] ?? 0
      const xhp1 = xh[p1] ?? 0
      const xhp2 = xh[p2] ?? 0
      return (hp2 * xhp1 - hp1 * xhp2) / (hp2 - hp1)
    }

    const ysect = (p1: number, p2: number): number => {
      const hp1 = h[p1] ?? 0
      const hp2 = h[p2] ?? 0
      const yhp1 = yh[p1] ?? 0
      const yhp2 = yh[p2] ?? 0
      return (hp2 * yhp1 - hp1 * yhp2) / (hp2 - hp1)
    }

    let m1: number
    let m2: number
    let m3: number
    let case_value: number
    let dmin: number
    let dmax: number
    let x1 = 0.0
    let x2 = 0.0
    let y1 = 0.0
    let y2 = 0.0

    // The indexing of im and jm should be noted as it has to start from zero
    // unlike the fortran counter part
    const im = [0, 1, 1, 0]
    const jm = [0, 0, 1, 1]

    // Note that castab is arranged differently from the FORTRAN code because
    // Fortran and C/C++ arrays are transposed of each other, in this case
    // it is more tricky as castab is in 3 dimensions
    const castab = [
      [
        [0, 0, 8], [0, 2, 5], [7, 6, 9]
      ],
      [
        [0, 3, 4], [1, 3, 1], [4, 3, 0]
      ],
      [
        [9, 6, 7], [5, 2, 0], [8, 0, 0]
      ]
    ]

    for (let j = jub - 1; j >= jlb; j--) {
      for (let i = ilb; i <= iub - 1; i++) {
        const row_i = d[i]
        const row_i1 = d[i + 1]
        if (!row_i || !row_i1) {
          continue
        }

        const dij = row_i[j] ?? 0
        const dij1 = row_i[j + 1] ?? 0
        const di1j = row_i1[j] ?? 0
        const di1j1 = row_i1[j + 1] ?? 0

        let temp1 = Math.min(dij, dij1)
        let temp2 = Math.min(di1j, di1j1)
        dmin = Math.min(temp1, temp2)
        temp1 = Math.max(dij, dij1)
        temp2 = Math.max(di1j, di1j1)
        dmax = Math.max(temp1, temp2)

        const z0 = z[0] ?? 0
        const znc1 = z[nc - 1] ?? 0

        if (dmax >= z0 && dmin <= znc1) {
          for (let k = 0; k < nc; k++) {
            const zk = z[k] ?? 0
            if (zk >= dmin && zk <= dmax) {
              for (let m = 4; m >= 0; m--) {
                if (m > 0) {
                  // The indexing of im and jm should be noted as it has to
                  // start from zero
                  const imM = im[m - 1] ?? 0
                  const jmM = jm[m - 1] ?? 0
                  const row = d[i + imM]
                  const val = (row ? row[j + jmM] : 0) ?? 0
                  h[m] = val - zk
                  xh[m] = x[i + imM] ?? 0
                  yh[m] = y[j + jmM] ?? 0
                } else {
                  h[0] = 0.25 * ((h[1] ?? 0) + (h[2] ?? 0) + (h[3] ?? 0) + (h[4] ?? 0))
                  xh[0] = 0.5 * ((x[i] ?? 0) + (x[i + 1] ?? 0))
                  yh[0] = 0.5 * ((y[j] ?? 0) + (y[j + 1] ?? 0))
                }
                const hm = h[m] ?? 0
                if (hm > 0.0) {
                  sh[m] = 1
                } else if (hm < 0.0) {
                  sh[m] = -1
                } else {
                  sh[m] = 0
                }
              }
              //
              // Note: at this stage the relative heights of the corners and the
              // centre are in the h array, and the corresponding coordinates are
              // in the xh and yh arrays. The centre of the box is indexed by 0
              // and the 4 corners by 1 to 4 as shown below.
              // Each triangle is then indexed by the parameter m, and the 3
              // vertices of each triangle are indexed by parameters m1,m2,and
              // m3.
              // It is assumed that the centre of the box is always vertex 2
              // though this isimportant only when all 3 vertices lie exactly on
              // the same contour level, in which case only the side of the box
              // is drawn.
              //
              //
              //      vertex 4 +-------------------+ vertex 3
              //               | \               / |
              //               |   \    m-3    /   |
              //               |     \       /     |
              //               |       \   /       |
              //               |  m=2    X   m=2   |       the centre is vertex 0
              //               |       /   \       |
              //               |     /       \     |
              //               |   /    m=1    \   |
              //               | /               \ |
              //      vertex 1 +-------------------+ vertex 2
              //
              //
              //
              //               Scan each triangle in the box
              //
              for (let m = 1; m <= 4; m++) {
                m1 = m
                m2 = 0
                if (m !== 4) {
                  m3 = m + 1
                } else {
                  m3 = 1
                }
                const plane1 = castab[(sh[m1] ?? 0) + 1]
                const plane2 = plane1 ? plane1[(sh[m2] ?? 0) + 1] : undefined
                case_value = plane2 ? (plane2[(sh[m3] ?? 0) + 1] ?? 0) : 0
                if (case_value !== 0) {
                  switch (case_value) {
                    case 1: // Line between vertices 1 and 2
                      x1 = xh[m1] ?? 0
                      y1 = yh[m1] ?? 0
                      x2 = xh[m2] ?? 0
                      y2 = yh[m2] ?? 0
                      break
                    case 2: // Line between vertices 2 and 3
                      x1 = xh[m2] ?? 0
                      y1 = yh[m2] ?? 0
                      x2 = xh[m3] ?? 0
                      y2 = yh[m3] ?? 0
                      break
                    case 3: // Line between vertices 3 and 1
                      x1 = xh[m3] ?? 0
                      y1 = yh[m3] ?? 0
                      x2 = xh[m1] ?? 0
                      y2 = yh[m1] ?? 0
                      break
                    case 4: // Line between vertex 1 and side 2-3
                      x1 = xh[m1] ?? 0
                      y1 = yh[m1] ?? 0
                      x2 = xsect(m2, m3)
                      y2 = ysect(m2, m3)
                      break
                    case 5: // Line between vertex 2 and side 3-1
                      x1 = xh[m2] ?? 0
                      y1 = yh[m2] ?? 0
                      x2 = xsect(m3, m1)
                      y2 = ysect(m3, m1)
                      break
                    case 6: //  Line between vertex 3 and side 1-2
                      x1 = xh[m3] ?? 0
                      y1 = yh[m3] ?? 0
                      x2 = xsect(m1, m2)
                      y2 = ysect(m1, m2)
                      break
                    case 7: // Line between sides 1-2 and 2-3
                      x1 = xsect(m1, m2)
                      y1 = ysect(m1, m2)
                      x2 = xsect(m2, m3)
                      y2 = ysect(m2, m3)
                      break
                    case 8: // Line between sides 2-3 and 3-1
                      x1 = xsect(m2, m3)
                      y1 = ysect(m2, m3)
                      x2 = xsect(m3, m1)
                      y2 = ysect(m3, m1)
                      break
                    case 9: // Line between sides 3-1 and 1-2
                      x1 = xsect(m3, m1)
                      y1 = ysect(m3, m1)
                      x2 = xsect(m1, m2)
                      y2 = ysect(m1, m2)
                      break
                    default:
                      break
                  }
                  // Put your processing code here and comment out the printf
                  // printf("%f %f %f %f %f\n",x1,y1,x2,y2,z[k]);
                  drawContour(x1, y1, x2, y2, zk, k)
                }
              }
            }
          }
        }
      }
    }
  }
}
