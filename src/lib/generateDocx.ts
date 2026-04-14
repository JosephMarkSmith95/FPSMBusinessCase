import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  LevelFormat,
  PageNumber,
  NumberFormat,
  UnderlineType,
  PageBreak,
} from "docx";

export interface StrategicObjective {
  label: string;
  checked: boolean;
  explanation: string;
}

export interface BusinessCaseData {
  caseName: string;
  caseOwner: string;
  execSummary: string;
  strategicRationale: string;
  objective: string;
  valueProposition: string;
  expectedOutcomes: string;
  objectives: StrategicObjective[];
}

// ─── Colour palette matching FPSM template ───────────────────────────────────
const BRAND_BLUE = "1F3864";
const ACCENT_BLUE = "2E5FA3";
const LIGHT_BLUE = "D5E8F0";
const MID_GREY = "F2F5F9";
const DARK_GREY = "3A3A3A";
const WHITE = "FFFFFF";
const BORDER_GREY = "CCCCCC";
const LEVEL_ORANGE = "C55A11";

// ─── Border helpers ───────────────────────────────────────────────────────────
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_GREY };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ─── Spacing helper ───────────────────────────────────────────────────────────
function spacer(pts = 6): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: pts * 20 } });
}

// ─── Bullet list helper ───────────────────────────────────────────────────────
function bulletParagraphs(text: string): Paragraph[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun({ text: line, font: "Calibri", size: 22 })],
          spacing: { after: 80 },
        })
    );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 26, color: BRAND_BLUE })],
    spacing: { before: 320, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_BLUE, space: 4 },
    },
  });
}

// ─── Level divider (matches "--- Level X ---" style) ─────────────────────────
function levelDivider(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        italics: true,
        color: LEVEL_ORANGE,
        font: "Calibri",
        size: 22,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: LEVEL_ORANGE, space: 8 },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LEVEL_ORANGE, space: 8 },
    },
  });
}

// ─── Title block ─────────────────────────────────────────────────────────────
function titleBlock(caseName: string, caseOwner: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Business Case: ${caseName}`,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: "Calibri",
          size: 36,
          color: BRAND_BLUE,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Business Case Owner: `,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: "Calibri",
          size: 24,
          color: BRAND_BLUE,
        }),
        new TextRun({
          text: caseOwner,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: "Calibri",
          size: 24,
          color: DARK_GREY,
        }),
      ],
      spacing: { after: 320 },
    }),
  ];
}

// ─── Strategic objectives table ───────────────────────────────────────────────
function objectivesTable(objectives: StrategicObjective[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: allBorders,
        shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
        width: { size: 4200, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Objective", bold: true, font: "Calibri", size: 20, color: WHITE })],
          }),
        ],
      }),
      new TableCell({
        borders: allBorders,
        shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
        width: { size: 800, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Y", bold: true, font: "Calibri", size: 20, color: WHITE })],
          }),
        ],
      }),
      new TableCell({
        borders: allBorders,
        shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
        width: { size: 4360, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Explain", bold: true, font: "Calibri", size: 20, color: WHITE })],
          }),
        ],
      }),
    ],
  });

  const dataRows = objectives.map(
    (obj, i) =>
      new TableRow({
        children: [
          new TableCell({
            borders: allBorders,
            shading: { fill: i % 2 === 0 ? MID_GREY : WHITE, type: ShadingType.CLEAR },
            width: { size: 4200, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: obj.label, font: "Calibri", size: 20, color: DARK_GREY })],
              }),
            ],
          }),
          new TableCell({
            borders: allBorders,
            shading: { fill: i % 2 === 0 ? MID_GREY : WHITE, type: ShadingType.CLEAR },
            width: { size: 800, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: obj.checked ? "✓" : "",
                    bold: true,
                    font: "Calibri",
                    size: 20,
                    color: obj.checked ? "1F6F2E" : DARK_GREY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: allBorders,
            shading: { fill: i % 2 === 0 ? MID_GREY : WHITE, type: ShadingType.CLEAR },
            width: { size: 4360, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: obj.explanation || "",
                    font: "Calibri",
                    size: 20,
                    color: DARK_GREY,
                    italics: !obj.explanation,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4200, 800, 4360],
    rows: [headerRow, ...dataRows],
  });
}

// ─── Value proposition callout box ───────────────────────────────────────────
function valuePropositionBox(text: string): Table {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 12, color: ACCENT_BLUE },
              bottom: thinBorder,
              left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT_BLUE },
              right: thinBorder,
            },
            shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
            width: { size: 9360, type: WidthType.DXA },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Value Proposition",
                    bold: true,
                    font: "Calibri",
                    size: 22,
                    color: ACCENT_BLUE,
                  }),
                ],
                spacing: { after: 100 },
              }),
              ...text
                .split("\n")
                .filter(Boolean)
                .map(
                  (line) =>
                    new Paragraph({
                      children: [
                        new TextRun({ text: line.trim(), font: "Calibri", size: 21, color: DARK_GREY }),
                      ],
                      spacing: { after: 60 },
                    })
                ),
            ],
          }),
        ],
      }),
    ],
  });
}

// ─── Main document builder ───────────────────────────────────────────────────
export async function generateBusinessCase(data: BusinessCaseData): Promise<Blob> {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
                run: { font: "Calibri" },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: DARK_GREY } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Calibri", color: BRAND_BLUE },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Calibri", color: BRAND_BLUE },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm margins
          },
          pageNumberStart: 1,
          pageNumberFormatType: NumberFormat.DECIMAL,
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [7200, 2160],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: { ...noBorders, bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_BLUE } },
                        width: { size: 7200, type: WidthType.DXA },
                        margins: { bottom: 80 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "BUSINESS CASE",
                                bold: true,
                                font: "Calibri",
                                size: 16,
                                color: BRAND_BLUE,
                                allCaps: true,
                              }),
                              new TextRun({
                                text: `  ·  ${data.caseName}`,
                                font: "Calibri",
                                size: 16,
                                color: "888888",
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        borders: { ...noBorders, bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_BLUE } },
                        width: { size: 2160, type: WidthType.DXA },
                        margins: { bottom: 80 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: "Page ",
                                font: "Calibri",
                                size: 16,
                                color: "888888",
                              }),
                              new TextRun({
                                children: [PageNumber.CURRENT],
                                font: "Calibri",
                                size: 16,
                                color: "888888",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          ...titleBlock(data.caseName, data.caseOwner),

          // ── LEVEL 1 ──────────────────────────────────────────────────────
          levelDivider("─── Level 1 ───"),

          // Executive Summary
          sectionHeading("Executive Summary"),
          ...bulletParagraphs(data.execSummary),
          spacer(8),

          // Strategic Rationale
          sectionHeading("Strategic Rationale"),
          ...bulletParagraphs(data.strategicRationale),
          spacer(8),

          // Strategic Alignment table
          new Paragraph({
            children: [
              new TextRun({
                text: "Strategic Alignment",
                bold: true,
                font: "Calibri",
                size: 22,
                color: DARK_GREY,
              }),
            ],
            spacing: { before: 160, after: 100 },
          }),
          objectivesTable(data.objectives),
          spacer(12),

          // Objective
          sectionHeading("Objective"),
          ...bulletParagraphs(data.objective),
          spacer(8),

          // Value Proposition
          sectionHeading("Value Proposition"),
          valuePropositionBox(data.valueProposition),
          spacer(12),

          // Expected Outcomes
          sectionHeading("Expected Outcomes"),
          ...bulletParagraphs(data.expectedOutcomes),
          spacer(8),

          // ── LEVEL 2 & 3 placeholder ──────────────────────────────────────
          levelDivider("─── Level 2 and 3 ───"),

          new Paragraph({
            children: [
              new TextRun({
                text: "The sections below (Product Description, Market Research, Team Requirements) are completed at Level 2 & 3 stage. See PRD linked from the cover page.",
                italics: true,
                font: "Calibri",
                size: 20,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 240 },
          }),

          // ── FINAL ADDITIONS placeholder ───────────────────────────────────
          levelDivider("─── Final Additions ───"),

          new Paragraph({
            children: [
              new TextRun({
                text: "Implementation Strategy, Key Milestones, Operational Checklist, and Risk Analysis are completed at the Final stage.",
                italics: true,
                font: "Calibri",
                size: 20,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 240 },
          }),

          // Status Log table placeholder
          spacer(16),
          new Paragraph({
            children: [
              new TextRun({
                text: "Status Log",
                bold: true,
                font: "Calibri",
                size: 22,
                color: BRAND_BLUE,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1800, 3000, 2160, 2400],
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  "Date",
                  "Summary",
                  "People",
                  "Status",
                ].map(
                  (h, i) =>
                    new TableCell({
                      borders: allBorders,
                      shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                      width: { size: [1800, 3000, 2160, 2400][i], type: WidthType.DXA },
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: h, bold: true, font: "Calibri", size: 20, color: WHITE }),
                          ],
                        }),
                      ],
                    })
                ),
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: allBorders,
                    width: { size: 1800, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString("en-GB"), font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    borders: allBorders,
                    width: { size: 3000, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: "Level 1 BC written", font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    borders: allBorders,
                    width: { size: 2160, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: data.caseOwner, font: "Calibri", size: 20 })] })],
                  }),
                  new TableCell({
                    borders: allBorders,
                    width: { size: 2400, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: "Done", font: "Calibri", size: 20 })] })],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
