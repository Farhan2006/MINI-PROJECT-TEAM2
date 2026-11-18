/* Portfolio data. Edited via admin.html (or by hand). Dates: YYYY-MM-DD. Newest entries first. */
window.SITE = {
  "title": "FPGA-Controlled Variable Gain Amplifier",
  "subtitle": "Semester V Foundation Integration Mini Project · Academic Year 2026–27",
  "dept": "Department of Electronics Engineering – VLSI Design and Technology",
  "school": "School of Electrical and Electronics Engineering · KLE Technological University, Hubballi",
  "theme": "Theme 1",
  "artefact": "Artefact 1",
  "teamNo": "02",
  "teamPhoto": "",
  "showTeamPhoto": true,
  "members": [
    {
      "name": "Swaroop T",
      "usn": "01FE24BEV012",
      "email": "01fe24bev012@kletech.ac.in",
      "photo": ""
    },
    {
      "name": "Veerabhadrayya",
      "usn": "01FE24BEV020",
      "email": "01fe24bev020@kletech.ac.in",
      "photo": ""
    },
    {
      "name": "Farhan B",
      "usn": "01FE24BEV022",
      "email": "01fe24bev022@kletech.ac.in",
      "photo": ""
    },
    {
      "name": "Shrihari U",
      "usn": "01FE24BEV023",
      "email": "01fe24bev023@kletech.ac.in",
      "photo": ""
    }
  ],
  "faculty": [
    {
      "name": "Sujata S Kotabagi",
      "dept": "Head of Department of VLSI"
    },
    {
      "name": "Pooja Goudar",
      "dept": "Department of VLSI"
    },
    {
      "name": "Vaishnavi Chandavari",
      "dept": "Department of VLSI"
    },
    {
      "name": "Asmita Aiholi",
      "dept": "Department of VLSI"
    }
  ],
  "latest": {
    "date": "2026-11-18",
    "text": "Project write-up added: problem, three gain-control concepts, architecture and the validation plan. Measurements are still to be taken."
  },
  "pageUpdated": {
    "problem": "2026-11-18",
    "concepts": "2026-11-18",
    "requirements": "2026-11-18",
    "architecture": "2026-11-18",
    "design": "2026-11-18",
    "integration": "2026-11-18",
    "validation": "2026-11-18",
    "notebook": "2026-11-18"
  },
  "defaultUpdated": "2026-11-18",
  "reviewDates": {
    "r1": "",
    "r2": "",
    "r3": "",
    "r4": "",
    "r5": "",
    "final": ""
  },
  "steps": [
    {
      "n": 1,
      "label": "Problem & need",
      "status": "progress"
    },
    {
      "n": 2,
      "label": "Concept choice",
      "status": "progress"
    },
    {
      "n": 3,
      "label": "Functional requirements",
      "status": "progress"
    },
    {
      "n": 4,
      "label": "Architecture",
      "status": "progress"
    },
    {
      "n": 5,
      "label": "Subsystem selection",
      "status": "next"
    },
    {
      "n": 6,
      "label": "Component selection",
      "status": "next"
    },
    {
      "n": 7,
      "label": "Calculations",
      "status": "next"
    },
    {
      "n": 8,
      "label": "Schematic & constraints",
      "status": "next"
    },
    {
      "n": 9,
      "label": "BOM & simulation",
      "status": "next"
    },
    {
      "n": 10,
      "label": "Testbench & simulation",
      "status": "next"
    },
    {
      "n": 11,
      "label": "Subsystem build & test",
      "status": "next"
    },
    {
      "n": 12,
      "label": "Integration",
      "status": "next"
    },
    {
      "n": 13,
      "label": "Validation",
      "status": "next"
    },
    {
      "n": 14,
      "label": "Debug & improve",
      "status": "next"
    },
    {
      "n": 15,
      "label": "Reflection",
      "status": "next"
    },
    {
      "n": 16,
      "label": "Demonstration",
      "status": "next"
    }
  ],
  "problem": {
    "need": "An analog signal whose amplitude varies has to be brought to a usable output level. A fixed gain cannot do that for every input, so the amount of amplification must be adjustable on command from a digital controller, while the analog signal itself stays in the analog path.",
    "inputs": [
      {
        "parameter": "Input signal",
        "value": "Audio / low-amplitude analog signal",
        "unit": "n/a",
        "source": "assumed",
        "note": "Amplitude range (Vpp and Vrms) still to be measured."
      },
      {
        "parameter": "Gain command",
        "value": "Digital data from the FPGA, converted to an analog control voltage by a DAC",
        "unit": "n/a",
        "source": "assumed",
        "note": "DAC resolution and range to be fixed at component selection."
      },
      {
        "parameter": "Power",
        "value": "Dual supply rails for the analog amplifier",
        "unit": "V",
        "source": "assumed",
        "note": "Voltages to be fixed at component selection."
      }
    ],
    "background": [
      {
        "title": "CD4066BE bilateral analog switch",
        "type": "datasheet",
        "learned": "Connects or disconnects resistor paths electronically. Its ON resistance adds to the feedback network and switching can inject transients, which limits gain accuracy.",
        "link": ""
      },
      {
        "title": "Op-amp feedback gain relations",
        "type": "app note",
        "learned": "Non-inverting gain Av = 1 + Rf/Rg; inverting gain Av = −Rf/Rin. If the feedback resistance is controlled, gain becomes a function of the control voltage.",
        "link": ""
      },
      {
        "title": "MOSFET as a voltage-controlled resistance",
        "type": "app note",
        "learned": "The channel resistance changes with control voltage, but not linearly, and it also depends on signal amplitude. It can introduce distortion, so the gain curve and THD must be characterised.",
        "link": ""
      }
    ],
    "candidateFRs": [
      {
        "id": "FR-A",
        "text": "The gain of the amplifier is set by the FPGA through a DAC control voltage."
      },
      {
        "id": "FR-B",
        "text": "The analog input signal is amplified in the analog path and is not routed through the FPGA."
      },
      {
        "id": "FR-C",
        "text": "The gain is repeatable when the same control setting is applied again."
      }
    ],
    "unknowns": [
      "Usable input amplitude range and the gain range that can be reached.",
      "How linearly the gain follows the DAC control voltage with the MOSFET in the feedback path.",
      "Distortion (THD) and usable bandwidth at each gain.",
      "How much the CD4066BE ON resistance and resistor tolerances shift the gain in the switched version.",
      "Settling time and output disturbance when the control value changes."
    ]
  },
  "concepts": {
    "criteria": [
      {
        "name": "Continuous gain adjustment",
        "weight": 3
      },
      {
        "name": "FPGA / real-time control",
        "weight": 3
      },
      {
        "name": "Low hardware complexity",
        "weight": 2
      },
      {
        "name": "Predictable gain accuracy",
        "weight": 2
      }
    ],
    "alternatives": [
      {
        "name": "MOSFET-controlled continuous gain (FPGA + DAC)",
        "sketch": "",
        "summary": "A DAC-controlled MOSFET modifies the effective feedback impedance of the op-amp, giving a potentially continuous gain-adjustment mechanism.",
        "rejectedBecause": "",
        "pros": [
          "FPGA-generated digital gain-control data",
          "DAC-based digital-to-analog control interface",
          "MOSFET-controlled feedback network",
          "Analog gain adjustment using a control voltage",
          "Potential for continuous gain variation",
          "Reduced dependence on multiple discrete feedback resistors",
          "Flexible gain control compared with fixed-step switching"
        ],
        "cons": [
          "MOSFET resistance is not perfectly linear with control voltage and signal amplitude.",
          "Gain may not change linearly with the DAC voltage.",
          "The MOSFET may introduce distortion, so the gain curve, THD, usable bandwidth and signal range must be characterised experimentally."
        ],
        "scores": {
          "Continuous gain adjustment": 5,
          "FPGA / real-time control": 5,
          "Low hardware complexity": 2,
          "Predictable gain accuracy": 2
        }
      },
      {
        "name": "CD4066BE gain switching",
        "sketch": "",
        "summary": "A CD4066BE bilateral analog switch connects or disconnects predefined feedback resistor paths, giving discrete gain levels.",
        "rejectedBecause": "Gain is limited to predefined resistor combinations, and switch ON resistance and transients affect accuracy. Kept as an alternative.",
        "pros": [
          "Simple analog implementation",
          "Easy to design and troubleshoot",
          "Multiple gain levels can be selected electronically",
          "Suitable for FPGA-controlled gain switching",
          "No mechanical switching required"
        ],
        "cons": [
          "Gain is restricted to predefined resistor combinations.",
          "ON resistance of the CD4066BE affects the effective resistance of the feedback network.",
          "Switch resistance, signal-dependent behaviour and resistor tolerances can affect gain accuracy.",
          "Switching can introduce transients or glitches into the output.",
          "The gain resolution depends on the number of available resistor combinations."
        ],
        "scores": {
          "Continuous gain adjustment": 2,
          "FPGA / real-time control": 4,
          "Low hardware complexity": 3,
          "Predictable gain accuracy": 3
        }
      },
      {
        "name": "Physical DIP-switch gain selection",
        "sketch": "",
        "summary": "A physical DIP switch selects different resistor configurations in the op-amp feedback network. Each position gives a predefined gain that the user chooses by hand.",
        "rejectedBecause": "Manual only: no real-time or automated gain control. Kept as a simple prototyping alternative.",
        "pros": [
          "Very simple and low-cost implementation",
          "No FPGA control required for gain selection",
          "Easy to understand and demonstrate",
          "Useful for testing different gain configurations",
          "Good for prototyping and debugging"
        ],
        "cons": [
          "Manual gain adjustment",
          "No real-time or automated gain control",
          "Limited number of gain settings",
          "Requires physical intervention to change gain",
          "Not suitable for dynamic gain adjustment"
        ],
        "scores": {
          "Continuous gain adjustment": 1,
          "FPGA / real-time control": 1,
          "Low hardware complexity": 5,
          "Predictable gain accuracy": 4
        }
      }
    ],
    "comparison": {
      "heads": [
        "Feature",
        "MOSFET control",
        "CD4066BE",
        "Physical DIP switch"
      ],
      "rows": [
        [
          "Gain adjustment",
          "Continuous / potentially continuous",
          "Discrete",
          "Discrete"
        ],
        [
          "Control",
          "DAC analog voltage",
          "Digital switch control",
          "Manual"
        ],
        [
          "FPGA integration",
          "Yes",
          "Possible",
          "Not necessary"
        ],
        [
          "Resistor selection",
          "MOSFET-controlled network",
          "Switched resistor network",
          "Manually selected resistor network"
        ],
        [
          "Gain resolution",
          "Depends on MOSFET and control range",
          "Number of resistor combinations",
          "Number of switch configurations"
        ],
        [
          "Dynamic adjustment",
          "Possible",
          "Possible",
          "No"
        ],
        [
          "Hardware complexity",
          "Higher",
          "Moderate",
          "Low"
        ],
        [
          "Main limitation",
          "MOSFET nonlinearity and distortion",
          "ON resistance and discrete steps",
          "Manual operation"
        ],
        [
          "Best use",
          "Flexible gain control",
          "Automated fixed-gain selection",
          "Prototyping and manual testing"
        ]
      ]
    },
    "chosen": "MOSFET-controlled continuous gain (FPGA + DAC)",
    "reason": "Unlike a fixed resistor bank, the MOSFET-based architecture aims to give a continuously adjustable gain-control mechanism. That makes the architecture more flexible and suited to investigating dynamic signal-level adjustment. The CD4066BE and DIP-switch versions are kept as alternatives for comparison, not as separate projects.",
    "scopeIn": [
      "Programmable gain from the FPGA through a DAC control voltage",
      "MOSFET-controlled op-amp feedback network",
      "Comparison with the CD4066BE and DIP-switch versions",
      "Characterisation of gain, bandwidth, distortion, settling time and repeatability"
    ],
    "scopeOut": [
      "Routing the analog input through the FPGA (that would need an ADC)",
      "Future improvements: gain calibration, linearisation, automated gain control and closed-loop gain correction"
    ]
  },
  "frFrozen": "",
  "fr": [
    {
      "id": "FR1",
      "requirement": "The amplifier gain is set by the FPGA through a DAC control voltage.",
      "target": "To be set",
      "method": "Oscilloscope: Vout/Vin at each DAC step",
      "source": "assumed",
      "status": "draft",
      "predicted": "",
      "measured": "",
      "deviation": "",
      "explanation": ""
    },
    {
      "id": "FR2",
      "requirement": "The analog input signal stays in the analog path and is not routed through the FPGA.",
      "target": "No digital processing of the signal",
      "method": "Inspection of the schematic and signal path",
      "source": "assumed",
      "status": "draft",
      "predicted": "",
      "measured": "",
      "deviation": "",
      "explanation": ""
    },
    {
      "id": "FR3",
      "requirement": "Gain is repeatable for repeated control settings.",
      "target": "To be set",
      "method": "Repeat each setting and compare the gain",
      "source": "assumed",
      "status": "draft",
      "predicted": "",
      "measured": "",
      "deviation": "",
      "explanation": ""
    },
    {
      "id": "FR4",
      "requirement": "The gain-control range, from minimum to maximum gain, is characterised.",
      "target": "To be set",
      "method": "Sweep the DAC code, record Vout/Vin and gain in dB",
      "source": "assumed",
      "status": "draft",
      "predicted": "",
      "measured": "",
      "deviation": "",
      "explanation": ""
    },
    {
      "id": "FR5",
      "requirement": "Distortion added by the MOSFET-controlled stage is characterised.",
      "target": "To be set",
      "method": "THD measurement at selected gains",
      "source": "assumed",
      "status": "draft",
      "predicted": "",
      "measured": "",
      "deviation": "",
      "explanation": ""
    },
    {
      "id": "FR6",
      "requirement": "Settling time and switching transient after a control change are characterised.",
      "target": "To be set",
      "method": "Oscilloscope capture of the output across a control step",
      "source": "assumed",
      "status": "draft",
      "predicted": "",
      "measured": "",
      "deviation": "",
      "explanation": ""
    }
  ],
  "frHistory": [],
  "architecture": {
    "diagram": "",
    "flow": [
      {
        "name": "Analog input signal",
        "sub": "Audio / low-amplitude signal"
      },
      {
        "name": "Op-amp variable gain stage",
        "sub": "MOSFET-controlled feedback network"
      },
      {
        "name": "Amplified analog output",
        "sub": "Variable-amplitude output"
      }
    ],
    "controlPath": {
      "name": "FPGA → DAC → MOSFET control voltage",
      "sub": "Gain-control path: adjusts the amplifier feedback impedance"
    },
    "paths": [
      {
        "title": "A. Analog signal path",
        "steps": [
          "The analog input signal is applied to the op-amp amplifier.",
          "The amplifier processes the signal through its feedback network.",
          "The output amplitude changes depending on the effective feedback impedance."
        ]
      },
      {
        "title": "B. Gain-control path",
        "steps": [
          "The FPGA generates digital control data.",
          "The digital control data is converted into an analog voltage using a DAC.",
          "The DAC output drives the MOSFET-based gain-control circuit.",
          "The MOSFET changes the effective resistance / impedance of the amplifier feedback network.",
          "The gain of the amplifier changes accordingly."
        ]
      }
    ],
    "note": "The FPGA does not process the analog input signal directly unless an ADC is added. In this architecture the FPGA only controls the amplifier's gain; the analog signal itself stays in the analog signal path.",
    "hierarchy": [
      {
        "label": "Primary design",
        "text": "FPGA + DAC + MOSFET-controlled op-amp feedback network."
      },
      {
        "label": "Alternative 1",
        "text": "CD4066BE-based switched feedback resistor network."
      },
      {
        "label": "Alternative 2",
        "text": "Physical DIP-switch-based feedback resistor selection."
      }
    ],
    "blocks": [
      {
        "name": "Analog input source",
        "input": "Signal to be amplified",
        "output": "Low-amplitude analog signal",
        "fr": "FR2"
      },
      {
        "name": "Op-amp variable gain stage",
        "input": "Analog signal + feedback impedance",
        "output": "Amplified analog signal",
        "fr": "FR1"
      },
      {
        "name": "MOSFET feedback element",
        "input": "Analog control voltage",
        "output": "Effective feedback resistance",
        "fr": "FR1"
      },
      {
        "name": "DAC",
        "input": "Digital gain data",
        "output": "Analog control voltage",
        "fr": "FR1"
      },
      {
        "name": "FPGA",
        "input": "Gain setting",
        "output": "Digital gain-control data",
        "fr": "FR1"
      },
      {
        "name": "Amplified analog output",
        "input": "Amplified signal",
        "output": "Variable-amplitude output",
        "fr": "FR4"
      }
    ],
    "subsystemChoices": [
      {
        "subsystem": "Gain-control method",
        "options": [
          "MOSFET + DAC",
          "CD4066BE switching",
          "DIP switch"
        ],
        "chosen": "MOSFET + DAC",
        "reason": "Only this option gives potentially continuous, FPGA-driven gain. The other two stay as alternatives for comparison."
      },
      {
        "subsystem": "Where the signal is processed",
        "options": [
          "Analog path only",
          "Through the FPGA (needs an ADC)"
        ],
        "chosen": "Analog path only",
        "reason": "The FPGA only generates control data, so no ADC is needed and the signal stays analog."
      }
    ]
  },
  "design": {
    "calcs": [
      {
        "title": "Gain relations of the op-amp feedback network",
        "fr": "FR1",
        "equation": "Non-inverting: Av = 1 + Rf/Rg   |   Inverting: Av = −Rf/Rin   |   With the MOSFET in Rf: Av = f(Vcontrol)",
        "values": "Rf is set by the MOSFET operating point, which the DAC voltage controls. Component values are not fixed yet.",
        "result": "Pending component values",
        "margin": "—",
        "date": "2026-11-18"
      },
      {
        "title": "Gain expressed in decibels",
        "fr": "FR4",
        "equation": "Av = Vout / Vin   |   Gain (dB) = 20·log10 |Av|",
        "values": "Vin and Vout measured on the oscilloscope as Vpp and Vrms at each control setting.",
        "result": "Pending measurements",
        "margin": "—",
        "date": "2026-11-18"
      }
    ],
    "components": [
      {
        "part": "FPGA",
        "role": "Generates digital gain-control data",
        "reason": "Gives programmable, repeatable control of the gain.",
        "alternatives": "Manual DIP switch",
        "date": "2026-11-18"
      },
      {
        "part": "DAC",
        "role": "Converts FPGA digital data into an analog control voltage",
        "reason": "Lets a digital value set the MOSFET operating point.",
        "alternatives": "Digital switch control (CD4066BE)",
        "date": "2026-11-18"
      },
      {
        "part": "Op-amp",
        "role": "Amplifies the input analog signal",
        "reason": "The feedback network around it sets the gain.",
        "alternatives": "—",
        "date": "2026-11-18"
      },
      {
        "part": "MOSFET",
        "role": "Controls the effective impedance in the feedback network",
        "reason": "A voltage-controlled resistance allows continuous gain variation.",
        "alternatives": "CD4066BE switched resistors; DIP-switch resistor network",
        "date": "2026-11-18"
      },
      {
        "part": "Feedback resistors",
        "role": "Determine amplifier gain and operating range",
        "reason": "Set the gain range around the MOSFET.",
        "alternatives": "—",
        "date": "2026-11-18"
      },
      {
        "part": "CD4066BE",
        "role": "Bilateral analog switching for discrete gain selection in the alternative circuit",
        "reason": "Electronically switched resistor network.",
        "alternatives": "MOSFET control",
        "date": "2026-11-18"
      },
      {
        "part": "DIP switch",
        "role": "Manual selection of feedback resistor configurations",
        "reason": "Simple prototyping and testing aid.",
        "alternatives": "CD4066BE",
        "date": "2026-11-18"
      },
      {
        "part": "Dual power supply",
        "role": "Provides the required analog amplifier supply rails",
        "reason": "The op-amp needs positive and negative rails.",
        "alternatives": "—",
        "date": "2026-11-18"
      },
      {
        "part": "Analog input source",
        "role": "Provides the signal to be amplified",
        "reason": "Needed to drive and test the amplifier.",
        "alternatives": "—",
        "date": "2026-11-18"
      },
      {
        "part": "Oscilloscope",
        "role": "Used to observe input/output waveforms and gain behaviour",
        "reason": "Measures Vin, Vout, distortion and settling.",
        "alternatives": "—",
        "date": "2026-11-18"
      }
    ],
    "media": [],
    "bom": []
  },
  "courses": [
    "Signals and Systems",
    "Analog Electronic Circuits",
    "Linear Integrated Circuits",
    "Digital Circuits",
    "TODO — Course 5 (Handbook §1.3)",
    "TODO — Course 6 (Handbook §1.3)",
    "TODO — Course 7 (Handbook §1.3)",
    "TODO — Course 8 (Handbook §1.3)",
    "TODO — Course 9 (Handbook §1.3)"
  ],
  "coverageNote": "",
  "decisions": [
    {
      "id": "D1",
      "page": "concepts",
      "date": "2026-11-18",
      "decision": "Use a DAC-controlled MOSFET in the op-amp feedback network as the primary gain-control method",
      "options": [
        {
          "name": "MOSFET-controlled feedback (FPGA + DAC)",
          "reason": "Potentially continuous gain, controlled by a voltage the FPGA can set."
        },
        {
          "name": "CD4066BE switched resistors",
          "reason": "Discrete steps only, and ON resistance and transients affect accuracy."
        },
        {
          "name": "Physical DIP switch",
          "reason": "Manual; cannot be controlled by the FPGA or changed in real time."
        }
      ],
      "fr": "FR1: gain set by the FPGA through a DAC control voltage",
      "courses": [
        {
          "course": "Analog Electronic Circuits",
          "concept": "non-inverting closed-loop gain, Av = 1 + Rf/Rg"
        },
        {
          "course": "Linear Integrated Circuits",
          "concept": "op-amp feedback configurations"
        },
        {
          "course": "Digital Circuits",
          "concept": "digital control data generated by the FPGA"
        }
      ],
      "how": "With a MOSFET inside Rf, gain becomes a function of the control voltage: Av = f(Vcontrol). The FPGA sets a digital code, the DAC turns it into the control voltage, and the MOSFET changes the feedback resistance.",
      "meets": "MOSFET resistance is not perfectly linear with control voltage and signal amplitude, so the gain may not follow the DAC voltage linearly and the stage may add distortion. Gain curve, THD and bandwidth must be measured.",
      "predicted": "",
      "predictedDate": "",
      "measured": "",
      "instrument": "",
      "learning": ""
    }
  ],
  "map": [
    {
      "step": "05",
      "decision": "D1",
      "course": "Analog Electronic Circuits",
      "concept": "Non-inverting closed-loop gain",
      "level": "Applied"
    }
  ],
  "build": {
    "sims": [],
    "tests": [],
    "media": [],
    "deviations": []
  },
  "validation": {
    "instruments": [
      {
        "instrument": "Oscilloscope",
        "settings": "To be recorded at the time of measurement."
      }
    ],
    "media": [],
    "improvement": "",
    "plan": [
      {
        "parameter": "Input voltage",
        "measure": "Input amplitude in Vpp and Vrms"
      },
      {
        "parameter": "Output voltage",
        "measure": "Output amplitude at each control setting"
      },
      {
        "parameter": "Voltage gain",
        "measure": "Vout / Vin"
      },
      {
        "parameter": "Gain in dB",
        "measure": "20·log10 |Av|"
      },
      {
        "parameter": "Gain-control range",
        "measure": "Minimum gain to maximum gain"
      },
      {
        "parameter": "Gain resolution",
        "measure": "Change in gain per DAC control step"
      },
      {
        "parameter": "Frequency response",
        "measure": "Gain variation over the operating frequency range"
      },
      {
        "parameter": "Bandwidth",
        "measure": "Frequency limits for the selected gain"
      },
      {
        "parameter": "THD",
        "measure": "Distortion introduced by the MOSFET-controlled stage"
      },
      {
        "parameter": "Noise",
        "measure": "Output noise and signal-to-noise ratio, if measured"
      },
      {
        "parameter": "Settling time",
        "measure": "Time for the gain to stabilise after a control change"
      },
      {
        "parameter": "Switching transient",
        "measure": "Output disturbance during gain transitions"
      },
      {
        "parameter": "Repeatability",
        "measure": "Variation in gain for repeated control settings"
      }
    ]
  },
  "failures": [],
  "failuresRequired": 3,
  "notebook": [
    {
      "date": "2026-11-18",
      "author": "Team 02",
      "objective": "Documented the problem, three gain-control concepts, the architecture and the validation plan.",
      "decision": "The MOSFET-controlled continuous-gain design is the primary architecture. The CD4066BE and DIP-switch versions are alternatives for comparison.",
      "course": "Analog Electronic Circuits",
      "learning": "The FPGA only controls the gain. The analog signal stays in the analog path unless an ADC is added. MOSFET resistance is not linear, so the gain curve and distortion must be measured, not assumed.",
      "next": "Fix component values, set numeric targets for the FRs, simulate gain against control voltage, then build and measure."
    },
    {
      "date": "2026-11-18",
      "author": "Team 02",
      "objective": "Set up the portfolio site and structure.",
      "decision": "Static site (HTML/CSS/JS) deployed on Vercel, instead of Google Sites.",
      "course": "—",
      "learning": "The Guide's 16-page structure maps cleanly to one page per design step.",
      "next": "Fill Page 2 (Problem and Need) before Review 1."
    }
  ],
  "reviewRecord": [],
  "reflections": [],
  "lessons": {
    "minor": [],
    "cohort": [],
    "carry": []
  },
  "demo": {
    "video": "",
    "poster": ""
  },
  "files": [
    {
      "label": "Formal report (Appendix A)",
      "href": "",
      "note": "PDF"
    },
    {
      "label": "RTL and firmware repository",
      "href": "",
      "note": "Git"
    },
    {
      "label": "Schematic files",
      "href": "",
      "note": "Appendix I naming"
    },
    {
      "label": "Simulation files",
      "href": "",
      "note": "Appendix I naming"
    }
  ],
  "fullTitle": "FPGA-Controlled Variable Gain Amplifier with MOSFET-Based Continuous Gain Adjustment",
  "about": {
    "domain": [
      "Analog Electronics",
      "FPGA",
      "DAC",
      "Signal Conditioning",
      "Mixed-Signal Design"
    ],
    "objective": "To design a variable gain amplifier capable of adjusting the amplitude of an input analog signal through FPGA-controlled circuitry, enabling programmable gain control and potentially continuous gain variation.",
    "summary": "The project explores multiple gain-control architectures: digitally switched gain selection using analog switches and physical DIP switches, and a MOSFET-controlled op-amp feedback network that enables continuous gain adjustment.",
    "technologies": [
      "FPGA",
      "DAC",
      "Op-Amp",
      "MOSFET",
      "CD4066BE",
      "Analog Feedback Networks",
      "Signal Conditioning",
      "Mixed-Signal Electronics"
    ],
    "objectives": [
      "Programmable gain control of an analog amplifier.",
      "FPGA-to-DAC interfacing for analog control generation.",
      "MOSFET-based modulation of the amplifier feedback network.",
      "Continuous gain adjustment versus discrete gain selection.",
      "Comparison of semiconductor-based control and manual switching.",
      "Analog signal amplification without routing the analog signal through the FPGA.",
      "Evaluation of the effects of switching resistance, MOSFET nonlinearity and circuit component tolerances."
    ]
  },
  "chainNote": "FPGA → DAC → MOSFET control voltage. This gain-control path adjusts the amplifier's feedback impedance.",
  "chain": [
    {
      "id": "in",
      "group": "signal",
      "name": "Analog input signal",
      "sub": "Audio / low-amplitude signal",
      "page": "problem",
      "viz": "wave-in",
      "info": "The signal to be amplified enters here. Its amplitude varies, which is why a fixed gain is not enough. It stays in the analog path and is never routed through the FPGA.",
      "facts": [
        "Audio / low-amplitude analog signal",
        "Amplitude range still to be measured (Vpp and Vrms)",
        "Never passes through the FPGA"
      ]
    },
    {
      "id": "amp",
      "group": "signal",
      "name": "Op-amp variable gain stage",
      "sub": "MOSFET-controlled feedback network",
      "page": "architecture",
      "viz": "wave-amp",
      "info": "An op-amp with a MOSFET inside its feedback network. The control voltage changes the MOSFET's effective resistance, which changes the feedback impedance and therefore the gain.",
      "facts": [
        "Non-inverting: Av = 1 + Rf/Rg, with Rf set by the MOSFET",
        "Gain becomes a function of the control voltage: Av = f(Vcontrol)",
        "MOSFET nonlinearity may add distortion, to be measured"
      ]
    },
    {
      "id": "out",
      "group": "signal",
      "name": "Amplified analog output",
      "sub": "Variable-amplitude output",
      "page": "validation",
      "viz": "wave-out",
      "info": "The amplified signal. Its amplitude follows the commanded gain. Gain, bandwidth, THD, settling time and repeatability will be measured on the oscilloscope; the plan is on the Validation page.",
      "facts": [
        "Gain = Vout / Vin",
        "Gain in dB = 20·log10 |Av|",
        "No results are shown until they are measured"
      ]
    },
    {
      "id": "fpga",
      "group": "control",
      "name": "FPGA",
      "sub": "Digital gain data",
      "page": "design",
      "viz": "bits",
      "info": "Generates the digital gain-control data. It gives programmable, repeatable control of the gain. It does not process the analog signal unless an ADC is added.",
      "facts": [
        "Outputs digital control data only",
        "Alternative considered: a manual DIP switch",
        "The analog signal stays in the analog path"
      ]
    },
    {
      "id": "dac",
      "group": "control",
      "name": "DAC",
      "sub": "Digital data to control voltage",
      "page": "design",
      "viz": "steps",
      "info": "Converts the FPGA's digital value into the analog control voltage that sets the MOSFET's operating point. Its resolution and range are still to be fixed at component selection.",
      "facts": [
        "One DAC step is one gain step",
        "Gain resolution depends on the DAC step and the MOSFET range",
        "Settling time after a step will be measured"
      ]
    },
    {
      "id": "mos",
      "group": "control",
      "name": "MOSFET",
      "sub": "Sets the feedback impedance",
      "page": "concepts",
      "viz": "curve",
      "info": "Used as a voltage-controlled resistance in the op-amp feedback network, which allows continuous gain. Its resistance is not perfectly linear with control voltage, so the gain curve has to be characterised.",
      "facts": [
        "Gives potentially continuous gain",
        "Resistance is not linear with control voltage or signal amplitude",
        "Alternatives: CD4066BE switching, DIP switch"
      ]
    }
  ]
};
