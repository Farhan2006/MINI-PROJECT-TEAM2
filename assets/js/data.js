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
  "showTeamPhoto": false,
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
    "date": "2026-11-19",
    "text": "Concept choices now open with signal selection, then sensor selection, control-voltage alternatives (PWM with RC filter, DAC) and the gain-control methods."
  },
  "pageUpdated": {
    "problem": "2026-11-19",
    "concepts": "2026-11-19",
    "requirements": "2026-11-18",
    "architecture": "2026-11-18",
    "design": "2026-11-19",
    "integration": "2026-11-18",
    "validation": "2026-11-18",
    "notebook": "2026-11-19"
  },
  "defaultUpdated": "2026-11-19",
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
        "parameter": "Signal type",
        "value": "Analog audio-frequency",
        "note": "Selected"
      },
      {
        "parameter": "Waveform",
        "value": "Sinusoidal",
        "note": "Assumed"
      },
      {
        "parameter": "Frequency",
        "value": "1 kHz",
        "note": "Initial test condition"
      },
      {
        "parameter": "Input amplitude",
        "value": "100 mVpp",
        "note": "Initial test condition"
      },
      {
        "parameter": "Peak amplitude",
        "value": "50 mV",
        "note": "Calculated: Vpeak = Vpp / 2"
      },
      {
        "parameter": "RMS voltage",
        "value": "35.36 mV",
        "note": "Calculated: VRMS = Vpeak / √2"
      },
      {
        "parameter": "DC offset",
        "value": "0 V",
        "note": "Assumed"
      },
      {
        "parameter": "Initial signal source",
        "value": "Function generator",
        "note": "Selected"
      },
      {
        "parameter": "Measurement",
        "value": "DSO",
        "note": "Laboratory equipment"
      },
      {
        "parameter": "Gain command",
        "value": "Digital data from the FPGA, converted to an analog control voltage by a DAC",
        "note": "DAC resolution and range to be fixed at component selection."
      },
      {
        "parameter": "Power",
        "value": "Dual supply rails for the analog amplifier",
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
        "title": "JFET as a voltage-controlled resistance",
        "type": "app note",
        "learned": "The channel resistance changes with control voltage, but not linearly, and it also depends on signal amplitude. It can introduce distortion, so the gain curve and THD must be characterised.",
        "link": ""
      },
      {
        "title": "Honeywell SS49E datasheet",
        "type": "datasheet",
        "learned": "Linear Hall-effect sensing, sensitivity, output bias and magnetic-field response. Typical sensitivity 1.4 mV/G, typical zero-field output 2.5 V at a 5 V supply, response time 3 µs.",
        "link": ""
      },
      {
        "title": "Digilent Arty A7 Reference Manual",
        "type": "reference design",
        "learned": "FPGA architecture, 100 MHz clock, switches, push buttons and GPIO. The board provides a 100 MHz clock, four push buttons, four slide switches, four user LEDs and PMOD expansion interfaces.",
        "link": ""
      },
      {
        "title": "Xilinx Artix-7 DS181",
        "type": "datasheet",
        "learned": "FPGA electrical specifications and I/O characteristics. The FPGA uses configurable I/O banks; the selected user I/O configuration is 3.3 V LVCMOS33.",
        "link": ""
      },
      {
        "title": "Microchip AVR131 application note",
        "type": "app note",
        "learned": "PWM-based analog waveform generation and RC low-pass filtering.",
        "link": ""
      }
    ],
    "candidateFRs": [
      {
        "id": "FR-01",
        "text": "The system shall allow selection of eight different gain-control states.",
        "acceptance": "All eight binary combinations must be recognized."
      },
      {
        "id": "FR-02",
        "text": "The FPGA shall output a digital control signal corresponding to the selected state.",
        "acceptance": "Eight distinct digital output codes (e.g., 3-bit parallel lines 000 to 111)."
      },
      {
        "id": "FR-03",
        "text": "The digital control signal shall be converted into an analog control voltage using a DAC stage.",
        "acceptance": "Eight distinguishable steady-state output voltages."
      }
    ],
    "unknowns": [
      "Usable input amplitude range and the gain range that can be reached.",
      "How linearly the gain follows the DAC control voltage with the JFET in the feedback path.",
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
        "name": "JFET-controlled continuous gain (FPGA + DAC)",
        "sketch": "",
        "summary": "A DAC-controlled JFET modifies the effective feedback impedance of the op-amp, giving a potentially continuous gain-adjustment mechanism.",
        "rejectedBecause": "",
        "pros": [
          "FPGA-generated digital gain-control data",
          "DAC-based digital-to-analog control interface",
          "JFET-controlled feedback network",
          "Analog gain adjustment using a control voltage",
          "Potential for continuous gain variation",
          "Reduced dependence on multiple discrete feedback resistors",
          "Flexible gain control compared with fixed-step switching"
        ],
        "cons": [
          "JFET resistance is not perfectly linear with control voltage and signal amplitude.",
          "Gain may not change linearly with the DAC voltage.",
          "The JFET may introduce distortion, so the gain curve, THD, usable bandwidth and signal range must be characterised experimentally."
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
        "JFET control",
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
          "JFET-controlled network",
          "Switched resistor network",
          "Manually selected resistor network"
        ],
        [
          "Gain resolution",
          "Depends on JFET and control range",
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
          "JFET nonlinearity and distortion",
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
    "chosen": "JFET-controlled continuous gain (FPGA + DAC)",
    "reason": "Unlike a fixed resistor bank, the JFET-based architecture aims to give a continuously adjustable gain-control mechanism. That makes the architecture more flexible and suited to investigating dynamic signal-level adjustment. The CD4066BE and DIP-switch versions are kept as alternatives for comparison, not as separate projects.",
    "scopeIn": [
      "Programmable gain from the FPGA through a DAC control voltage",
      "JFET-controlled op-amp feedback network",
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
      "requirement": "Distortion added by the JFET-controlled stage is characterised.",
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
        "sub": "JFET-controlled feedback network"
      },
      {
        "name": "Amplified analog output",
        "sub": "Variable-amplitude output"
      }
    ],
    "controlPath": {
      "name": "FPGA → DAC → JFET control voltage",
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
          "The DAC output drives the JFET-based gain-control circuit.",
          "The JFET changes the effective resistance / impedance of the amplifier feedback network.",
          "The gain of the amplifier changes accordingly."
        ]
      }
    ],
    "note": "The FPGA does not process the analog input signal directly unless an ADC is added. In this architecture the FPGA only controls the amplifier's gain; the analog signal itself stays in the analog signal path.",
    "hierarchy": [
      {
        "label": "Primary design",
        "text": "FPGA + DAC + JFET-controlled op-amp feedback network."
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
        "name": "JFET feedback element",
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
          "JFET + DAC",
          "CD4066BE switching",
          "DIP switch"
        ],
        "chosen": "JFET + DAC",
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
        "equation": "Non-inverting: Av = 1 + Rf/Rg   |   Inverting: Av = −Rf/Rin   |   With the JFET in Rf: Av = f(Vcontrol)",
        "values": "Rf is set by the JFET operating point, which the DAC voltage controls. Component values are not fixed yet.",
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
      },
      {
        "title": "Peak amplitude of the test signal",
        "fr": "Input",
        "equation": "Vpeak = Vpp / 2 = 100 mV / 2",
        "values": "Vpp = 100 mVpp (initial test condition, sine wave)",
        "result": "50 mV",
        "margin": "—",
        "date": "2026-11-19"
      },
      {
        "title": "RMS voltage of the test signal",
        "fr": "Input",
        "equation": "VRMS = Vpeak / √2 = 50 mV / 1.414",
        "values": "Vpeak = 50 mV",
        "result": "35.36 mV",
        "margin": "—",
        "date": "2026-11-19"
      },
      {
        "title": "SS49E output at 10 G",
        "fr": "Sensor",
        "equation": "Vout = 2.5 V + (1.4 mV/G × 10 G)",
        "values": "Typical sensitivity 1.4 mV/G, zero-field output 2.5 V at a 5 V supply; linear region assumed",
        "result": "2.514 V",
        "margin": "Typical values, not worst case",
        "date": "2026-11-19"
      },
      {
        "title": "Sensor conditioning stage",
        "fr": "Sensor",
        "equation": "Vout = (Rf / Rin) × (VSS49E − Vref) + Vbias",
        "values": "Vref = 2.5 V, Vbias = 1.65 V (centre of a 3.3 V ADC range); Rf and Rin not fixed yet",
        "result": "Pending component values",
        "margin": "—",
        "date": "2026-11-19"
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
        "reason": "Lets a digital value set the JFET operating point.",
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
        "part": "JFET",
        "role": "Controls the effective impedance in the feedback network",
        "reason": "A voltage-controlled resistance allows continuous gain variation.",
        "alternatives": "CD4066BE switched resistors; DIP-switch resistor network",
        "date": "2026-11-18"
      },
      {
        "part": "Feedback resistors",
        "role": "Determine amplifier gain and operating range",
        "reason": "Set the gain range around the JFET.",
        "alternatives": "—",
        "date": "2026-11-18"
      },
      {
        "part": "CD4066BE",
        "role": "Bilateral analog switching for discrete gain selection in the alternative circuit",
        "reason": "Electronically switched resistor network.",
        "alternatives": "JFET control",
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
    "media": [
      {
        "type": "image",
        "src": "assets/img/amplifier-circuit.png",
        "caption": "Amplifier circuit: a non-inverting op-amp stage (Vin through Rp, feedback R2, load RL) with a JFET at its inverting input, set by a control stage (VControl through R1, referenced to VRef)."
      }
    ],
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
      "decision": "Use a DAC-controlled JFET in the op-amp feedback network as the primary gain-control method",
      "options": [
        {
          "name": "JFET-controlled feedback (FPGA + DAC)",
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
      "how": "With a JFET inside Rf, gain becomes a function of the control voltage: Av = f(Vcontrol). The FPGA sets a digital code, the DAC turns it into the control voltage, and the JFET changes the feedback resistance.",
      "meets": "JFET resistance is not perfectly linear with control voltage and signal amplitude, so the gain may not follow the DAC voltage linearly and the stage may add distortion. Gain curve, THD and bandwidth must be measured.",
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
        "measure": "Distortion introduced by the JFET-controlled stage"
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
      "date": "2026-11-19",
      "author": "Team 02",
      "objective": "Recorded the signal input specification, signal selection, Hall-effect sensor data and the reference study.",
      "decision": "Initial prototype input: a 1 kHz, 100 mVpp sine wave from a function generator. The SS49E Hall-effect sensor is the candidate sensor for later testing.",
      "course": "Analog Electronic Circuits",
      "learning": "The SS49E sits at about 2.5 V with no field, so its baseline has to be removed before amplification. Peak and RMS values follow from the peak-to-peak amplitude.",
      "next": "Add the strain gauge data, then fix the remaining control-voltage alternatives."
    },
    {
      "date": "2026-11-18",
      "author": "Team 02",
      "objective": "Documented the problem, three gain-control concepts, the architecture and the validation plan.",
      "decision": "The JFET-controlled continuous-gain design is the primary architecture. The CD4066BE and DIP-switch versions are alternatives for comparison.",
      "course": "Analog Electronic Circuits",
      "learning": "The FPGA only controls the gain. The analog signal stays in the analog path unless an ADC is added. JFET resistance is not linear, so the gain curve and distortion must be measured, not assumed.",
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
  "fullTitle": "FPGA-Controlled Variable Gain Amplifier with JFET-Based Continuous Gain Adjustment",
  "about": {
    "domain": [
      "Analog Electronics",
      "FPGA",
      "DAC",
      "Signal Conditioning",
      "Mixed-Signal Design"
    ],
    "objective": "To design a variable gain amplifier capable of adjusting the amplitude of an input analog signal through FPGA-controlled circuitry, enabling programmable gain control and potentially continuous gain variation.",
    "summary": "The project explores multiple gain-control architectures: digitally switched gain selection using analog switches and physical DIP switches, and a JFET-controlled op-amp feedback network that enables continuous gain adjustment.",
    "technologies": [
      "FPGA",
      "DAC",
      "Op-Amp",
      "JFET",
      "CD4066BE",
      "Analog Feedback Networks",
      "Signal Conditioning",
      "Mixed-Signal Electronics"
    ],
    "objectives": [
      "Programmable gain control of an analog amplifier.",
      "FPGA-to-DAC interfacing for analog control generation.",
      "JFET-based modulation of the amplifier feedback network.",
      "Continuous gain adjustment versus discrete gain selection.",
      "Comparison of semiconductor-based control and manual switching.",
      "Analog signal amplification without routing the analog signal through the FPGA.",
      "Evaluation of the effects of switching resistance, JFET nonlinearity and circuit component tolerances."
    ]
  },
  "chainNote": "FPGA → DAC → JFET control voltage. This gain-control path adjusts the amplifier's feedback impedance.",
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
      "sub": "JFET-controlled feedback network",
      "page": "architecture",
      "viz": "wave-amp",
      "info": "An op-amp with a JFET inside its feedback network. The control voltage changes the JFET's effective resistance, which changes the feedback impedance and therefore the gain.",
      "facts": [
        "Non-inverting: Av = 1 + Rf/Rg, with Rf set by the JFET",
        "Gain becomes a function of the control voltage: Av = f(Vcontrol)",
        "JFET nonlinearity may add distortion, to be measured"
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
      "info": "Converts the FPGA's digital value into the analog control voltage that sets the JFET's operating point. Its resolution and range are still to be fixed at component selection.",
      "facts": [
        "One DAC step is one gain step",
        "Gain resolution depends on the DAC step and the JFET range",
        "Settling time after a step will be measured"
      ]
    },
    {
      "id": "mos",
      "group": "control",
      "name": "JFET",
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
  ],
  "signalSelection": {
    "intro": "This is the first engineering decision: selecting a suitable signal for the variable gain amplifier.",
    "candidates": [
      {
        "signal": "Audio",
        "characteristics": "20 Hz – 20 kHz",
        "application": "Audio amplification"
      },
      {
        "signal": "Hall sensor",
        "characteristics": "Analog voltage varying with magnetic field",
        "application": "Magnetic-field measurement"
      },
      {
        "signal": "Strain gauge",
        "characteristics": "Small resistance variation",
        "application": "Force and weight measurement"
      },
      {
        "signal": "Piezoelectric",
        "characteristics": "Dynamic voltage",
        "application": "Vibration measurement"
      },
      {
        "signal": "Photodetector",
        "characteristics": "Light-dependent current/voltage",
        "application": "Optical sensing"
      }
    ],
    "scale": "Scoring: 1 = poor, 5 = excellent.",
    "signals": [
      "Audio",
      "Hall",
      "Strain gauge",
      "Piezo"
    ],
    "criteria": [
      {
        "name": "Signal availability",
        "weight": 20,
        "scores": [
          5,
          4,
          3,
          4
        ]
      },
      {
        "name": "Amplitude controllability",
        "weight": 20,
        "scores": [
          5,
          4,
          3,
          3
        ]
      },
      {
        "name": "Ease of testing",
        "weight": 20,
        "scores": [
          5,
          4,
          3,
          4
        ]
      },
      {
        "name": "Repeatability",
        "weight": 20,
        "scores": [
          5,
          4,
          3,
          3
        ]
      },
      {
        "name": "Suitability for VGA",
        "weight": 20,
        "scores": [
          5,
          5,
          5,
          4
        ]
      }
    ],
    "selectedLabel": "Selected for initial prototype",
    "selected": "Audio-frequency sine wave from function generator",
    "justification": [
      "The audio-frequency sine wave was selected as the initial input because its frequency and amplitude can be controlled independently. A function generator provides repeatable test conditions, allowing the amplifier's input and output amplitudes to be compared accurately.",
      "The initial testing frequency is 1 kHz and the input amplitude is 100 mVpp.",
      "This allows the system to be tested without introducing sensor noise or mechanical variations during initial development."
    ]
  },
  "sensors": {
    "intro": "The sensor selection study identifies a suitable real-world analog signal source for the future application of the VGA.",
    "candidates": [
      {
        "name": "SS49E Hall-effect sensor",
        "text": "Converts magnetic-field variation into a proportional analog output voltage.",
        "image": ""
      },
      {
        "name": "Strain gauge",
        "text": "Produces a small resistance variation according to applied mechanical strain.",
        "image": ""
      },
      {
        "name": "Piezoelectric sensor",
        "text": "Produces an electrical signal when subjected to mechanical deformation or vibration.",
        "image": ""
      }
    ],
    "compare": {
      "heads": [
        "Parameter",
        "SS49E",
        "Strain gauge"
      ],
      "rows": [
        {
          "parameter": "Supply",
          "v1": "2.7 – 6.5 V",
          "v2": "Excitation required"
        },
        {
          "parameter": "Output",
          "v1": "Analog voltage",
          "v2": "Resistance change"
        },
        {
          "parameter": "Sensitivity",
          "v1": "1.4 mV/G typical",
          "v2": "Gauge factor approximately 2 for common metal foil gauges"
        },
        {
          "parameter": "Signal nature",
          "v1": "DC and AC variations",
          "v2": "Static and dynamic strain"
        },
        {
          "parameter": "Conditioning",
          "v1": "Buffering",
          "v2": "Wheatstone bridge and amplifier"
        },
        {
          "parameter": "Contact required",
          "v1": "No",
          "v2": "Yes"
        },
        {
          "parameter": "Selected",
          "v1": "Yes",
          "v2": "No"
        }
      ],
      "note": "The strain-gauge gauge factor is representative of conventional metallic foil gauges; it is not a specification for a particular purchased part."
    },
    "specTitle": "SS49E numerical design data",
    "specBadge": "Preferred sensor for future sensor-based testing",
    "spec": [
      {
        "parameter": "Supply voltage",
        "value": "2.7 – 6.5 V"
      },
      {
        "parameter": "Typical supply current",
        "value": "6 mA"
      },
      {
        "parameter": "Typical sensitivity",
        "value": "1.4 mV/G"
      },
      {
        "parameter": "Minimum sensitivity",
        "value": "1.0 mV/G"
      },
      {
        "parameter": "Maximum sensitivity",
        "value": "1.75 mV/G"
      },
      {
        "parameter": "Zero-field output",
        "value": "2.5 V typical at 5 V"
      },
      {
        "parameter": "Magnetic operating range",
        "value": "±650 G minimum specified"
      },
      {
        "parameter": "Typical magnetic range",
        "value": "±1000 G"
      },
      {
        "parameter": "Response time",
        "value": "3 µs"
      }
    ],
    "conditioning": {
      "title": "Sensor conditioning (design note)",
      "intro": "The SS49E rests at about 2.5 V with no field. Gaining that directly would drive the op-amp into its supply rail (for example, a gain of 10 on 2.514 V at 10 G would ask for 25.14 V), so the 2.5 V quiescent voltage has to be subtracted before amplifying, using a differential or instrumentation amplifier.",
      "equation": "Vout = (Rf / Rin) × (VSS49E − Vref) + Vbias",
      "terms": [
        {
          "term": "Vref (2.5 V)",
          "text": "Removes the zero-field DC offset. A precision reference or a buffered divider from the same 5 V rail lets baseline drift cancel out."
        },
        {
          "term": "Vbias (1.65 V)",
          "text": "Shifts the amplified signal to the centre of a 3.3 V ADC range so the FPGA can read both North (negative) and South (positive) magnetic poles."
        },
        {
          "term": "Op-amp",
          "text": "A rail-to-rail input/output op-amp such as the MCP6002 or OPA2340 is suggested."
        }
      ]
    },
    "statusNote": "The function generator remains the actual input for the current prototype. The SS49E is a candidate sensor, not an already integrated input.",
    "strain": {
      "title": "Strain gauge data",
      "note": "Data to be added.",
      "rows": []
    }
  },
  "controlVoltage": {
    "intro": "The FPGA picks one of eight gain states as a 3-bit code. Three ways of turning that code into the analog control voltage are compared.",
    "alternatives": [
      {
        "name": "PWM with RC low-pass filter",
        "summary": "The FPGA drives a PWM output whose duty cycle follows the selected state. An RC low-pass filter averages the pulses into a steady analog control voltage (Microchip AVR131: PWM-based analog waveform generation and RC low-pass filtering).",
        "flow": [
          "FPGA",
          "PWM",
          "RC filter",
          "Vctrl"
        ],
        "viz": "pwm",
        "pros": [
          "Uses a single FPGA output pin",
          "No extra converter part is needed"
        ],
        "cons": [
          "The RC filter has to be sized to smooth the pulses",
          "The output settles slowly and keeps some ripple"
        ]
      },
      {
        "name": "DAC",
        "summary": "The FPGA's 3-bit control code goes straight into a digital-to-analog converter, which outputs one of eight steady control voltages (candidate FR-03: eight distinguishable steady-state output voltages).",
        "flow": [
          "FPGA",
          "3-bit code",
          "DAC",
          "Vctrl"
        ],
        "viz": "steps",
        "pros": [
          "Converts the digital code directly into a voltage",
          "Steady output without a smoothing filter"
        ],
        "cons": [
          "Needs a DAC part or resistor network and its interface",
          "Resolution is fixed by the number of bits"
        ]
      },
      {
        "name": "",
        "summary": "",
        "flow": [],
        "viz": "",
        "pros": [],
        "cons": []
      }
    ]
  }
};
