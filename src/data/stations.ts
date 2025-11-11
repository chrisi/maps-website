import type {Station} from "@/model/Station.ts";

export const stations: Station[] = [
  {
    posx: 958,
    posy: 1332,
    size: 8,
    country: 'South Korea',
    name: 'CHEONGJU',
    type: 'Airbase',
    details: {
      name: "CHEONGJU (RKTU)",
      lat: "N36° 42.857'",
      long: "E127° 29.493'",
      elev: "176 ft",
      rwy: "06L/24R - 06R/24L",
      tcn: "27X",
      atis: "128.85",
      ops: "305.5",
      gnd: "275.8",
      twr: "250.2",
      appdep: "292.9",
      charts: [
        {
          name: "EOR-Procedure Chart",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU)_EOR.png",
          page: 1
        },
        {
          name: "VISUAL RWY 06/24",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - VISUAL.pdf",
          page: 1
        },
        {
          name: "ILS RWY 24R (111.7)",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - ILS.pdf",
          page: 21
        },
        {
          name: "RNP RWY 06L",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - ILS.pdf",
          page: 1
        },
        {
          name: "RNP RWY 24R",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - ILS.pdf",
          page: 17
        },
        {
          name: "VOR RWY 06L",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - ILS.pdf",
          page: 15
        },
        {
          name: "VOR RWY 24R",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - ILS.pdf",
          page: 31
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Cheongju Intl (RKTU)/Cheongju Intl (RKTU) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1158,
    posy: 1502,
    size: 8,
    country: 'South Korea',
    name: 'DAEGU',
    type: 'Airbase',
    details: {
      name: "DAEGU (RKTN)",
      lat: "N35°53.672'",
      long: "E129°39.557'",
      elev: "120 ft",
      rwy: "13R/31L - 13L/31R",
      tcn: "125X",
      atis: "127.65",
      ops: "", // Not provided in the HTML
      gnd: "275.8",
      twr: "365.0",
      appdep: "346.3",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ADC.pdf",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 13L (111.9)",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 13R (108.7)",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 31L (108.7)",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 9
        },
        {
          name: "RNP RWY 13L",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 7
        },
        {
          name: "RNP RWY 13R",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 5
        },
        {
          name: "RNP RWY 31L",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 13
        },
        {
          name: "RNP RWY 31R",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 19
        },
        {
          name: "TACAN 31L",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 15
        },
        {
          name: "TACAN 31R",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - ILS.pdf",
          page: 21
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Daegu AB (RKTN)/Daegu AB (RKTN) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1198,
    posy: 1113,
    size: 6,
    country: 'South Korea',
    name: 'GANGNEUNG',
    type: 'Airbase',
    details: {
      name: "GANGNEUNG (RKNN)",
      lat: "N37°45.275'",
      long: "E128°56.576'",
      elev: "22 ft",
      rwy: "08/26",
      tcn: "56X",
      atis: "132.05",
      ops: "", // Not provided in the HTML
      gnd: "275.8",
      twr: "334.9",
      appdep: "304.0",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea/Gangneung/Gangneung_Airport.png",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Gangneung AB (RKNN)/Gangneung AB (RKNN)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 26 (111.5)",
          url: "01 South Korea/Gangneung/Gangneung_ILS_26.png",
          page: 1
        },
        {
          name: "TACAN RWY 26",
          url: "01 South Korea (ROK-US)/Gangneung AB (RKNN)/Gangneung AB (RKNN) - tacan_rwy_26.pdf",
          page: 1
        },
        {
          name: "Gangneung 1D Departure",
          url: "01 South Korea (ROK-US)/Gangneung AB (RKNN)/Gangneung AB (RKNN) - 1d_dep.pdf",
          page: 1
        },
        {
          name: "Gangwon 3 Departure",
          url: "01 South Korea (ROK-US)/Gangneung AB (RKNN)/Gangneung AB (RKNN) - 3_dep.pdf",
          page: 1
        },
        {
          name: "Pilit One Departure",
          url: "01 South Korea (ROK-US)/Gangneung AB (RKNN)/Gangneung AB (RKNN) - pilit_dep.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1203,
    posy: 1652,
    size: 8,
    country: 'South Korea',
    name: 'GIMHAE',
    type: 'Airbase',
    details: {
      name: "GIMHAE (RKPK)",
      lat: "N35°13.020'",
      long: "E128°56.009'",
      elev: "14 ft",
      rwy: "18L/36R - 18R/36L",
      tcn: "117X",
      atis: "126.65",
      ops: "", // Not provided in the HTML
      gnd: "274.8",
      twr: "233.3",
      appdep: "225.1",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Gimhae Intl (RKPK)/Gimhae Intl (RKPK) - ADC.pdf",
          page: 1
        },
        {
          name: "Visual Approach",
          url: "01 South Korea (ROK-US)/Gimhae Intl (RKPK)/Gimhae Intl (RKPK) - VISUAL.pdf",
          page: 1
        },
        {
          name: "RNP RWY 18L/R",
          url: "01 South Korea (ROK-US)/Gimhae Intl (RKPK)/Gimhae Intl (RKPK) - ILS.pdf",
          page: 29
        },
        {
          name: "RNP RWY 36R",
          url: "01 South Korea (ROK-US)/Gimhae Intl (RKPK)/Gimhae Intl (RKPK) - ILS.pdf",
          page: 23
        },
        {
          name: "ILS RWY 36R (109.5)",
          url: "01 South Korea (ROK-US)/Gimhae Intl (RKPK)/Gimhae Intl (RKPK) - ILS.pdf",
          page: 15
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Gimhae Intl (RKPK)/Gimhae Intl (RKPK) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 842,
    posy: 1158,
    size: 8,
    country: 'South Korea',
    name: 'GIMPO',
    type: 'Airbase',
    details: {
      name: "GIMPO (RKSS)",
      lat: "N37°33.263'",
      long: "E127°47.678'",
      elev: "48 ft",
      rwy: "14L/32R - 14R/32L",
      tcn: "83X",
      atis: "126.35",
      ops: "", // Not provided in the HTML
      gnd: "236.7",
      twr: "240.9",
      appdep: "363.8",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Gimpo Intl (RKSS)/Gimpo Intl (RKSS) - ADC.pdf",
          page: 1
        },
        {
          name: "ILS RWY 14L (109.9)",
          url: "01 South Korea (ROK-US)/Gimpo Intl (RKSS)/Gimpo Intl (RKSS) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 14R (108.7)",
          url: "01 South Korea (ROK-US)/Gimpo Intl (RKSS)/Gimpo Intl (RKSS) - ILS.pdf",
          page: 7
        },
        {
          name: "ILS RWY 32L (108.3)",
          url: "01 South Korea (ROK-US)/Gimpo Intl (RKSS)/Gimpo Intl (RKSS) - ILS.pdf",
          page: 11
        },
        {
          name: "ILS RWY 32R (110.7)",
          url: "01 South Korea (ROK-US)/Gimpo Intl (RKSS)/Gimpo Intl (RKSS) - ILS.pdf",
          page: 17
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Gimpo Intl (RKSS)/Gimpo Intl (RKSS) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 810,
    posy: 1500,
    size: 8,
    country: 'South Korea',
    name: 'GUNSAN',
    type: 'Airbase',
    details: {
      name: "GUNSAN (RKJK)",
      lat: "N35°54.297'",
      long: "E126°37.064'",
      elev: "22 ft",
      rwy: "18/36",
      tcn: "75X",
      atis: "120.225",
      ops: "", // Not provided in the HTML
      gnd: "273.525",
      twr: "292.3",
      appdep: "292.65",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK) - ADC.pdf",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 18 (110.3)",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 36 (110.3)",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK) - ILS.pdf",
          page: 3
        },
        {
          name: "TACAN RWY 18 (112.8)",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK) - ILS.pdf",
          page: 5
        },
        {
          name: "TACAN RWY 36 (112.8)",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK) - ILS.pdf",
          page: 7
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Gunsan AB (RKJK)/Gunsan AB (RKJK) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 841,
    posy: 1662,
    size: 8,
    country: 'South Korea',
    name: 'GWANGJU',
    type: 'Airbase',
    details: {
      name: "GWANGJU (RKJJ)",
      lat: "N35°07.916'",
      long: "E126°48.349'",
      elev: "42 ft",
      rwy: "04L/22R - 04R/22L",
      tcn: "91X",
      atis: "128.875",
      ops: "", // Not provided in the HTML
      gnd: "275.8",
      twr: "254.6",
      appdep: "268.0",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - ADC.pdf",
          page: 1
        },
        {
          name: "Visual Approach",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - VISUAL.pdf",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 04R (111.1)",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - ILS.pdf",
          page: 1
        },
        {
          name: "RNP RWY 04L",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - ILS.pdf",
          page: 13
        },
        {
          name: "RNP RWY 22L",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - ILS.pdf",
          page: 23
        },
        {
          name: "TACAN RWY 04L",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - ILS.pdf",
          page: 15
        },
        {
          name: "TACAN RWY 22L",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - ILS.pdf",
          page: 21
        },
        {
          name: "Standard Arrivals",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - STAR.pdf",
          page: 1
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Gwangju AB (RKJJ)/Gwangju AB (RKJJ) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 787,
    posy: 1173,
    size: 8,
    country: 'South Korea',
    name: 'INCHEON',
    type: 'Airbase',
    details: {
      name: "INCHEON (RKSI)",
      lat: "N37°28.430'",
      long: "E126°27.083'",
      elev: "18 ft",
      rwy: "15L/33R-15R/33L",
      tcn: "76X",
      atis: "128.45",
      ops: "", // Not provided in the HTML
      gnd: "266.925",
      twr: "231.8",
      appdep: "293.225",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - ADC.pdf",
          page: 1
        },
        {
          name: "ILS RWY 15L (111.9)",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 15R (109.1)",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - ILS.pdf",
          page: 9
        },
        {
          name: "ILS RWY 33L (109.3)",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - ILS.pdf",
          page: 23
        },
        {
          name: "ILS RWY 33R (108.9)",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - ILS.pdf",
          page: 27
        },
        {
          name: "Visual Approach",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - VISUAL.pdf",
          page: 1
        },
        {
          name: "Standard Arrivals",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - STAR.pdf",
          page: 1
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Incheon Intl (RKSI)/Incheon Intl (RKSI) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1023,
    posy: 1267,
    size: 8,
    country: 'South Korea',
    name: 'JUNGWON',
    type: 'Airbase',
    details: {
      name: "JUNGWON (RKTI)",
      lat: "N37°01.699'",
      long: "E127°53.116'",
      elev: "290 ft",
      rwy: "18L/36R - 18R/36L",
      tcn: "05X",
      atis: "135.6",
      ops: "",
      gnd: "275.9",
      twr: "230.15",
      appdep: "306.7",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea/Jungwon/Jungwon_Airport.png",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Jungwon AB (RKTI)/Jungwon AB (RKTI)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 36R (111.3)",
          url: "01 South Korea (ROK-US)/Jungwon AB (RKTI)/Jungwon AB (RKTI) - ilsdme_rwy_36r.pdf",
          page: 1
        },
        {
          name: "TACAN RWY 36L",
          url: "01 South Korea (ROK-US)/Jungwon AB (RKTI)/Jungwon AB (RKTI) - tacan_rwy_36l.pdf",
          page: 1
        },
        {
          name: "TACAN RWY 36R",
          url: "01 South Korea (ROK-US)/Jungwon AB (RKTI)/Jungwon AB (RKTI) - tacan_rwy_36r.pdf",
          page: 1
        },
        {
          name: "Jungwon 2 Departure",
          url: "01 South Korea (ROK-US)/Jungwon AB (RKTI)/Jungwon AB (RKTI) - jungwon_dep.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1188,
    posy: 1253,
    size: 8,
    country: 'South Korea',
    name: 'KOTAR',
    type: 'Airbase'
  },
  {
    posx: 769,
    posy: 1688,
    size: 8,
    country: 'South Korea',
    name: 'MUAN',
    type: 'Airbase',
    details: {
      name: "MUAN (RKJB)",
      lat: "N35°00.059'",
      long: "E126°23.191'",
      elev: "44 ft",
      rwy: "01/19",
      tcn: "47X",
      atis: "127.425",
      ops: "",
      gnd: "231.7",
      twr: "228.25",
      appdep: "240.0",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Muan Intl (RKJB)/Muan Intl (RKJB) - ADC.pdf",
          page: 1
        },
        {
          name: "ILS RWY 01 (111.9)",
          url: "01 South Korea (ROK-US)/Muan Intl (RKJB)/Muan Intl (RKJB) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 19 (108.9)",
          url: "01 South Korea (ROK-US)/Muan Intl (RKJB)/Muan Intl (RKJB) - ILS.pdf",
          page: 11
        },
        {
          name: "Visual Approach",
          url: "01 South Korea (ROK-US)/Muan Intl (RKJB)/Muan Intl (RKJB) - VISUAL.pdf",
          page: 1
        },
        {
          name: "Standard Arrivals",
          url: "01 South Korea (ROK-US)/Muan Intl (RKJB)/Muan Intl (RKJB) - STAR.pdf",
          page: 1
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Muan Intl (RKJB)/Muan Intl (RKJB) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 880,
    posy: 1252,
    size: 6,
    country: 'South Korea',
    name: 'OSAN',
    type: 'Airbase',
    details: {
      name: "OSAN AB (RKSO)",
      lat: "N37°04.862'",
      long: "E127°01.386'",
      elev: "97 ft",
      rwy: "09L/27R - 09R/27L",
      tcn: "94X",
      atis: "132.125",
      ops: "",
      gnd: "253.7",
      twr: "308.8",
      appdep: "306.3",
      charts: [
        {
          name: "Airport Diagram",
          url: "https://cdn.falcon-bms.com/maps/01_KTO/charts/01 South Korea/Osan/Osan_Airport.png",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 09L (111.3)",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO) - ils_or_locdme_rwy_09l.pdf",
          page: 1
        },
        {
          name: "ILS RWY 27R (111.3)",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO) - ils_or_locdme_rwy_27r.pdf",
          page: 1
        },
        {
          name: "RNAV RWY 09L",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO) - rnav_gps_rwy_09l.pdf",
          page: 1
        },
        {
          name: "RNAV RWY 27R",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO) - rnav_gps_rwy_27r.pdf",
          page: 1
        },
        {
          name: "DRAGGIN 8 Departure",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO) - draggin_dep.pdf",
          page: 1
        },
        {
          name: "MUSTANG 4 Departure",
          url: "01 South Korea (ROK-US)/Osan AB (RKSO)/Osan AB (RKSO) - mustang_dep.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1283,
    posy: 1480,
    size: 6,
    country: 'South Korea',
    name: 'POHANG',
    type: 'Airbase',
    details: {
      name: "POHANG (RKTH)",
      lat: "N35°59.123'",
      long: "E129°25.200'",
      elev: "74 ft",
      rwy: "10/28",
      tcn: "72X",
      atis: "127.4",
      ops: "317.375",
      gnd: "275.4",
      twr: "236.6",
      appdep: "232.4",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Pohang AB (RKTH)/Pohang AB (RKTH) - ADC.pdf",
          page: 1
        },
        {
          name: "ILS RWY 10 (110.9)",
          url: "01 South Korea (ROK-US)/Pohang AB (RKTH)/Pohang AB (RKTH) - ILS.pdf",
          page: 1
        },
        {
          name: "TACAN RWY 10",
          url: "01 South Korea (ROK-US)/Pohang AB (RKTH)/Pohang AB (RKTH) - ILS.pdf",
          page: 3
        },
        {
          name: "TACAN RWY 28",
          url: "01 South Korea (ROK-US)/Pohang AB (RKTH)/Pohang AB (RKTH) - ILS.pdf",
          page: 9
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Pohang AB (RKTH)/Pohang AB (RKTH) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 882,
    posy: 1280,
    size: 8,
    country: 'South Korea',
    name: 'PYEONGTAEK',
    type: 'Airbase',
    details: {
      name: "PYEONGTAEK AF (RKSG)",
      lat: "N36°57.801'",
      long: "E127°01.873'",
      elev: "48 ft",
      rwy: "14/32",
      tcn: "19X",
      atis: "128.25",
      ops: "291.1",
      gnd: "229.7",
      twr: "257.8",
      appdep: "363.1",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea/Pyeongtaek/Pyeongtaek_Airport.png",
          page: 1
        },
        {
          name: "ILS RWY 32 (108.75)",
          url: "01 South Korea (ROK-US)/Pyeongtaek AAF (RKSG)/Pyeongtaek AAF (RKSG) - ils_or_loc_rwy_32.pdf",
          page: 1
        },
        {
          name: "DVOR RWY 32",
          url: "01 South Korea (ROK-US)/Pyeongtaek AAF (RKSG)/Pyeongtaek AAF (RKSG) - dvor_rwy_32.pdf",
          page: 1
        },
        {
          name: "RNAV RWY 32",
          url: "01 South Korea (ROK-US)/Pyeongtaek AAF (RKSG)/Pyeongtaek AAF (RKSG) - rnav_gps_rwy_32.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 1057,
    posy: 1671,
    size: 8,
    country: 'South Korea',
    name: 'SACHEON',
    type: 'Airbase',
    details: {
      name: "SACHEON (RKPS)",
      lat: "N35°04.997'",
      long: "E128°03.978'",
      elev: "20 ft",
      rwy: "06L/24R - 06R/24L",
      tcn: "37X",
      atis: "126.625",
      ops: "",
      gnd: "275.8",
      twr: "305.4",
      appdep: "317.425",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - ADC.pdf",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 06L (111.5)",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 24R (108.1)",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - ILS.pdf",
          page: 17
        },
        {
          name: "TACAN RWY 06L",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - ILS.pdf",
          page: 5
        },
        {
          name: "TACAN RWY 24L",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - ILS.pdf",
          page: 29
        },
        {
          name: "Standard Arrivals",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - STAR.pdf",
          page: 1
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Sacheon AB (RKPS)/Sacheon AB (RKPS) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 790,
    posy: 1332,
    size: 8,
    country: 'South Korea',
    name: 'SEOSAN',
    type: 'Airbase',
    details: {
      name: "SEOSAN (RKTP)",
      lat: "N36°42.343'",
      long: "E126°29.265'",
      elev: "42 ft",
      rwy: "03L/21R - 03R/21L",
      tcn: "73X",
      atis: "130.3",
      ops: "318.1",
      gnd: "275.8",
      twr: "353.1",
      appdep: "253.95",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea/Seosan/Seosan_Airport.png",
          page: 1
        },
        {
          name: "EOR Procedure Chart",
          url: "01 South Korea (ROK-US)/Seosan AB (RKTP)/Seosan AB (RKTP)_EOR.png",
          page: 1
        },
        {
          name: "ILS RWY 03R (111.5)",
          url: "01 South Korea (ROK-US)/Seosan AB (RKTP)/Seosan AB (RKTP) - ilsdme_or_locdme_rwy_03r.pdf",
          page: 1
        },
        {
          name: "ILS RWY 21L (110.1)",
          url: "01 South Korea (ROK-US)/Seosan AB (RKTP)/Seosan AB (RKTP) - ilsdme_or_locdme_rwy_21l.pdf",
          page: 1
        },
        {
          name: "HI-TACAN RWY 03L",
          url: "01 South Korea (ROK-US)/Seosan AB (RKTP)/Seosan AB (RKTP) - hi_tacan_rwy_03l.pdf",
          page: 1
        },
        {
          name: "HI-TACAN RWY 03R",
          url: "01 South Korea (ROK-US)/Seosan AB (RKTP)/Seosan AB (RKTP) - hi_tacan_rwy_03r.pdf",
          page: 1
        },
        {
          name: "HI-ILS RWY 03R",
          url: "01 South Korea (ROK-US)/Seosan AB (RKTP)/Seosan AB (RKTP) - hi_ils_or_locdme_rwy_3r.pdf",
          page: 1
        }
      ]
    }
  },
  {
    posx: 896,
    posy: 1180,
    size: 8,
    country: 'South Korea',
    name: 'SEOUL',
    type: 'Airbase',
    details: {
      name: "SEOUL AB (RKSM)",
      lat: "N37°26.922'",
      long: "E127°06.512'",
      elev: "90 ft",
      rwy: "01/19 - 20/02",
      tcn: "49X",
      atis: "126.4",
      ops: "",
      gnd: "276.2",
      twr: "237.1",
      appdep: "363.9",
      charts: [
        {
          name: "Airport Diagram",
          url: "01 South Korea (ROK-US)/Seoul AB (RKSM)/Seoul AB (RKSM) - ADC.pdf",
          page: 1
        },
        {
          name: "ILS RWY 20 (110.9)",
          url: "01 South Korea (ROK-US)/Seoul AB (RKSM)/Seoul AB (RKSM) - ILS.pdf",
          page: 1
        },
        {
          name: "ILS RWY 19 (108.95)",
          url: "01 South Korea (ROK-US)/Seoul AB (RKSM)/Seoul AB (RKSM) - ILS.pdf",
          page: 7
        },
        {
          name: "TACAN RWY 19",
          url: "01 South Korea (ROK-US)/Seoul AB (RKSM)/Seoul AB (RKSM) - ILS.pdf",
          page: 37
        },
        {
          name: "TACAN RWY 20",
          url: "01 South Korea (ROK-US)/Seoul AB (RKSM)/Seoul AB (RKSM) - ILS.pdf",
          page: 41
        },
        {
          name: "Standard Departures",
          url: "01 South Korea (ROK-US)/Seoul AB (RKSM)/Seoul AB (RKSM) - SID.pdf",
          page: 1
        }
      ]
    }
  },
  {posx: 878, posy: 1226, size: 6, country: 'South Korea', name: 'SUWON', type: 'Airbase'},
  {posx: 1038, posy: 1180, size: 6, country: 'South Korea', name: 'WONJU', type: 'Airbase'},
  {posx: 1152, posy: 1050, size: 6, country: 'South Korea', name: 'YANGYANG', type: 'Airbase'},
  {posx: 1106, posy: 1348, size: 6, country: 'South Korea', name: 'YECHEON', type: 'Airbase'},

  {posx: 1083, posy: 1447, size: 8, country: 'South Korea', name: 'GUMI', type: 'Airstrip'},
  {posx: 893, posy: 1210, size: 8, country: 'South Korea', name: 'SINGAL', type: 'Airstrip'},
  {posx: 861, posy: 1280, size: 8, country: 'South Korea', name: 'SONGWHAN', type: 'Airstrip'},
  {posx: 1140, posy: 1307, size: 8, country: 'South Korea', name: 'YEONGJU', type: 'Airstrip'},

  {posx: 1892, posy: 1780, size: 6, country: 'Japan', name: 'HIROSHIMA', type: 'Airbase'},
  {posx: 1780, posy: 1849, size: 6, country: 'Japan', name: 'IWAKUNI', type: 'Airbase'},
  {posx: 1697, posy: 1741, size: 6, country: 'Japan', name: 'IWAMI', type: 'Airbase'},
  {posx: 1277, posy: 1836, size: 6, country: 'Japan', name: 'TSUSHIMA', type: 'Airbase'},
  {posx: 1616, posy: 1898, size: 6, country: 'Japan', name: 'YAMAGUCHI', type: 'Airbase'},

  {posx: 922, posy: 573, size: 8, country: 'North Korea', name: 'CHANGJIN-UP', type: 'Airbase'},
  {posx: 677, posy: 1061, size: 8, country: 'North Korea', name: 'HAEJU', type: 'Airbase'},
  {posx: 679, posy: 927, size: 8, country: 'North Korea', name: 'HWANGJU', type: 'Airbase'},
  {posx: 1062, posy: 507, size: 8, country: 'North Korea', name: 'HWANGSUWON', type: 'Airbase'},
  {posx: 952, posy: 937, size: 8, country: 'North Korea', name: 'HYON-NI', type: 'Airbase'},
  {posx: 1153, posy: 573, size: 8, country: 'North Korea', name: 'IWON', type: 'Airbase'},
  {posx: 702, posy: 699, size: 8, country: 'North Korea', name: 'KAECHON', type: 'Airbase'},
  {posx: 957, posy: 822, size: 8, country: 'North Korea', name: 'KALMA', type: 'Airbase'},
  {posx: 813, posy: 921, size: 8, country: 'North Korea', name: 'KOKSAN', type: 'Airbase'},
  {posx: 1026, posy: 883, size: 8, country: 'North Korea', name: 'KUUM-NI', type: 'Airbase'},
  {posx: 553, posy: 971, size: 8, country: 'North Korea', name: 'KWAIL', type: 'Airbase'},
  {posx: 780, posy: 410, size: 8, country: 'North Korea', name: 'MANPO', type: 'Airbase'},
  {posx: 689, posy: 852, size: 8, country: 'North Korea', name: 'MIRIM', type: 'Airbase'},
  {posx: 732, posy: 1013, size: 8, country: 'North Korea', name: 'NUCHON-NI', type: 'Airbase'},
  {posx: 591, posy: 873, size: 8, country: 'North Korea', name: 'ONCHON', type: 'Airbase'},
  {posx: 1297, posy: 347, size: 8, country: 'North Korea', name: 'ORANG', type: 'Airbase'},
  {posx: 592, posy: 659, size: 8, country: 'North Korea', name: 'PANGHYON', type: 'Airbase'},
  {posx: 712, posy: 750, size: 8, country: 'North Korea', name: 'PUKCHANG-UP', type: 'Airbase'},
  {posx: 1101, posy: 251, size: 8, country: 'North Korea', name: 'SAMJIYON-UP', type: 'Airbase'},
  {posx: 956, posy: 702, size: 8, country: 'North Korea', name: 'SONDOK', type: 'Airbase'},

  {posx: 662, posy: 807, size: 8, country: 'North Korea', name: 'SUNAN', type: 'Airbase'},
  {posx: 700, posy: 769, size: 8, country: 'North Korea', name: 'SUNCHON', type: 'Airbase'},
  {posx: 638, posy: 666, size: 8, country: 'North Korea', name: 'TAECHON', type: 'Airbase'},
  {posx: 589, posy: 1033, size: 8, country: 'North Korea', name: 'TAETAN', type: 'Airbase'},
  {posx: 978, posy: 648, size: 8, country: 'North Korea', name: 'TOKSAN', type: 'Airbase'},
  {posx: 481, posy: 608, size: 8, country: 'North Korea', name: 'UIJU', type: 'Airbase'},
  {posx: 1246, posy: 456, size: 8, country: 'North Korea', name: 'KILCHU', type: 'Airstrips'},
  {posx: 686, posy: 843, size: 8, country: 'North Korea', name: 'PYONGYANG', type: 'Airstrips'},
  {posx: 728, posy: 906, size: 8, country: 'North Korea', name: 'SANGWON', type: 'Airstrips'},
  {posx: 1177, posy: 566, size: 8, country: 'North Korea', name: 'TANCH\'ON', type: 'Airstrips'},
  {posx: 927, posy: 746, size: 8, country: 'North Korea', name: 'YONGHUNG', type: 'Airstrips'},

// <area shape="circle" coords="1301,2109,17" href="javascript:void(0);" alt="North Korea Airstrips" title="AYANG-NI" onclick="return popup('AYANG-NI');"/-->
// <area shape="circle" coords="2051,1892,17" href="javascript:void(0);" alt="North Korea Airstrips" title="HOEYANG SE" onclick="return popup('HOEYANG_SE');"/-->
// <area shape="circle" coords="1690,1968,17" href="javascript:void(0);" alt="North Korea Airstrips" title="ICH'ON" onclick="return popup('ICHON');"/-->
// <area shape="circle" coords="1230,1417,17" href="javascript:void(0);" alt="North Korea Airstrips" title="KAECH'ON SW" onclick="return popup('KAECHON_SW');"/-->
  {posx: 1246, posy: 456, size: 8, country: 'North Korea', name: 'KILCHU', type: 'Airbase'},
// <area shape="circle" coords="2144,1858,17" href="javascript:void(0);" alt="North Korea Airstrips" title="KOJO" onclick="return popup('KOJO');"/-->
// <area shape="circle" coords="1595,1891,17" href="javascript:void(0);" alt="North Korea Airstrips" title="KOKSAN HWY" onclick="return popup('KOKSAN_NK');"/-->
// <area shape="circle" coords="1227,1492,17" href="javascript:void(0);" alt="North Korea Airstrips" title="KWAKSAN" onclick="return popup('KWAKSAN');"/-->
// <area shape="circle" coords="2931,0641,17" href="javascript:void(0);" alt="North Korea Airstrips" title="KYONGSONG CHUUL" onclick="return popup('KYONGSONG_CHUUL');"/>
// <area shape="circle" coords="1443,2121,17" href="javascript:void(0);" alt="North Korea Airstrips" title="NUCH'ON-NI" onclick="return popup('NUCHON-NI');"/>
// <area shape="circle" coords="1906,1654,17" href="javascript:void(0);" alt="North Korea Airstrips" title="OKPYONG-NI" onclick="return popup('OKPYONG-NI');"/>
// <area shape="circle" coords="0940,1381,17" href="javascript:void(0);" alt="North Korea Airstrips" title="PANGHYON" onclick="return popup('PANGHYON');"/-->

  {posx: 98, posy: 233, size: 8, country: 'China', name: 'SHENYANG DONGTA', type: 'Airbase'},

  {posx: 1153, posy: 1497, size: 21, country: 'South Korea', name: 'DAEGU (TAE)', type: 'VOR/DME'},
  {
    posx: 1198,
    posy: 1113,
    size: 21,
    country: 'South Korea',
    name: 'GANGNEUNG (KOG)',
    type: 'VOR/DME'
  },
  {posx: 842, posy: 1662, size: 6, country: 'South Korea', name: 'GWANGJU (KWA)', type: 'VOR/DME'},
  {posx: 783, posy: 1170, size: 6, country: 'South Korea', name: 'INCHEON (NCN)', type: 'VOR/DME'},
  {posx: 783, posy: 1170, size: 6, country: 'South Korea', name: 'JUNGWON (CHW)', type: 'VOR/DME'},
  {posx: 769, posy: 1688, size: 6, country: 'South Korea', name: 'MUAN (MUA)', type: 'VOR/DME'},
  {posx: 1281, posy: 1479, size: 6, country: 'South Korea', name: 'POHANG (KPO)', type: 'VOR/DME'},
  {posx: 1277, posy: 1836, size: 21, country: 'Japan', name: 'TSUSHIMA (TSU)', type: 'VOR/DME'},
  {
    posx: 1616,
    posy: 1898,
    size: 21,
    country: 'Japan',
    name: 'YAMAGUCHI-UBE (YUE)',
    type: 'VOR/DME'
  },

  {posx: 866, posy: 1188, size: 21, country: 'South Korea', name: 'ANYANG (SEL)', type: 'VORTAC'},
  {posx: 1217, posy: 1662, size: 21, country: 'South Korea', name: 'BUSAN (PSN)', type: 'VORTAC'},
  {posx: 960, posy: 1330, size: 21, country: 'South Korea', name: 'CHEONGJU (CHO)', type: 'VORTAC'},
  {posx: 1143, posy: 1518, size: 21, country: 'South Korea', name: 'DALSUNG (TGU)', type: 'VORTAC'},
  {posx: 1143, posy: 1519, size: 21, country: 'South Korea', name: 'DONCHON (DOC)', type: 'VORTAC'},
  {posx: 1168, posy: 1127, size: 21, country: 'South Korea', name: 'GANGWON (KAE)', type: 'VORTAC'},
  {posx: 1206, posy: 1642, size: 21, country: 'South Korea', name: 'GIMHAE (KMH)', type: 'VORTAC'},
  {posx: 842, posy: 1662, size: 21, country: 'South Korea', name: 'GWANGJU (KWJ)', type: 'VORTAC'},
  {posx: 809, posy: 1499, size: 21, country: 'South Korea', name: 'KUNSAN (KUZ)', type: 'VORTAC'},
  {posx: 880, posy: 1253, size: 10, country: 'South Korea', name: 'OSAN (OSN)', type: 'VORTAC'},
  {posx: 1292, posy: 1481, size: 21, country: 'South Korea', name: 'POHANG (NPH)', type: 'VORTAC'},
  {posx: 1058, posy: 1669, size: 21, country: 'South Korea', name: 'SACHEON (SAC)', type: 'VORTAC'},
  {posx: 896, posy: 1180, size: 21, country: 'South Korea', name: 'SEOUL (KSM)', type: 'VORTAC'},
  {posx: 1141, posy: 1031, size: 21, country: 'South Korea', name: 'SOKCHO (SCH)', type: 'VORTAC'},
  {posx: 882, posy: 1253, size: 21, country: 'South Korea', name: 'SONGTAN (SOT)', type: 'VORTAC'},
  {posx: 1273, posy: 1562, size: 21, country: 'South Korea', name: 'ULSAN (USN)', type: 'VORTAC'},
  {posx: 876, posy: 1118, size: 21, country: 'South Korea', name: 'YANGJU (YJU)', type: 'VORTAC'},
  {posx: 738, posy: 1337, size: 21, country: 'South Korea', name: 'YANGYANG (YAG)', type: 'VORTAC'},
  {posx: 1098, posy: 1349, size: 21, country: 'South Korea', name: 'YECHEON (CUN)', type: 'VORTAC'},
  {posx: 980, posy: 1722, size: 6, country: 'South Korea', name: 'YEOSU (YSU)', type: 'VORTAC'},

  {posx: 1893, posy: 1782, size: 21, country: 'Japan', name: 'HONGO (HGE)', type: 'VORTAC'},
  {posx: 1780, posy: 1846, size: 21, country: 'Japan', name: 'IWAKUNI (NEU)', type: 'VORTAC'},
  {posx: 1878, posy: 1577, size: 21, country: 'Japan', name: 'IZUMO (XZE)', type: 'VORTAC'},
  {posx: 1763, posy: 1862, size: 21, country: 'Japan', name: 'KUGA (IWC)', type: 'VORTAC'},
  {posx: 1861, posy: 1909, size: 21, country: 'Japan', name: 'MATSUYAMA (MPE)', type: 'VORTAC'},
  {posx: 1572, posy: 1912, size: 21, country: 'Japan', name: 'SOUH (SWE)', type: 'VORTAC'},

  {posx: 118, posy: 280, size: 21, country: 'China', name: 'DAHUSHAN (DHN)', type: 'VORTAC'},
  {posx: 447, posy: 583, size: 21, country: 'China', name: 'DANDONG (DDG)', type: 'VORTAC'},
  {posx: 81, posy: 1208, size: 21, country: 'China', name: 'WEIHAI (WEH)', type: 'VORTAC'},
]

export const coordsByCountryType = stations.reduce((obj, coord) => {
  const key = `${coord.country} - ${coord.type}s`;
  if (!obj[key]) {
    obj[key] = [];
  }
  obj[key].push(coord);
  return obj;
}, {} as Record<string, Station[]>);
