import type { Screenplay, ElementType } from '../types/screenplay';

/**
 * Map our element types to FDX paragraph types
 */
const ELEMENT_TO_FDX_TYPE: Record<ElementType, string> = {
  'scene-heading': 'Scene Heading',
  'action': 'Action',
  'character': 'Character',
  'dialogue': 'Dialogue',
  'parenthetical': 'Parenthetical',
  'transition': 'Transition',
};

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate FDX XML from a Screenplay
 */
export function generateFdx(screenplay: Screenplay): string {
  const lines: string[] = [];

  // XML declaration and root element
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<FinalDraft DocumentType="Script" Template="No" Version="1">');

  // Title page if present
  if (screenplay.titlePage || screenplay.title) {
    lines.push('  <TitlePage>');
    lines.push('    <Content>');

    // Title
    const title = screenplay.titlePage?.title || screenplay.title;
    if (title) {
      lines.push('      <Paragraph Alignment="Center">');
      lines.push(`        <Text>${escapeXml(title.toUpperCase())}</Text>`);
      lines.push('      </Paragraph>');
      lines.push('      <Paragraph Alignment="Center">');
      lines.push('        <Text></Text>');
      lines.push('      </Paragraph>');
    }

    // Written by
    const writtenBy = screenplay.titlePage?.writtenBy || 'Written by';
    lines.push('      <Paragraph Alignment="Center">');
    lines.push(`        <Text>${escapeXml(writtenBy)}</Text>`);
    lines.push('      </Paragraph>');

    // Author
    const author = screenplay.titlePage?.author || screenplay.author;
    if (author) {
      lines.push('      <Paragraph Alignment="Center">');
      lines.push(`        <Text>${escapeXml(author)}</Text>`);
      lines.push('      </Paragraph>');
    }

    // Based on
    if (screenplay.titlePage?.basedOn) {
      lines.push('      <Paragraph Alignment="Center">');
      lines.push('        <Text></Text>');
      lines.push('      </Paragraph>');
      lines.push('      <Paragraph Alignment="Center">');
      lines.push(`        <Text>${escapeXml(screenplay.titlePage.basedOn)}</Text>`);
      lines.push('      </Paragraph>');
    }

    // Draft date
    if (screenplay.titlePage?.draftDate) {
      lines.push('      <Paragraph Alignment="Center">');
      lines.push('        <Text></Text>');
      lines.push('      </Paragraph>');
      lines.push('      <Paragraph Alignment="Center">');
      lines.push(`        <Text>${escapeXml(screenplay.titlePage.draftDate)}</Text>`);
      lines.push('      </Paragraph>');
    }

    // Contact info (bottom left)
    if (screenplay.titlePage?.contactInfo) {
      lines.push('      <Paragraph Alignment="Left">');
      lines.push(`        <Text>${escapeXml(screenplay.titlePage.contactInfo)}</Text>`);
      lines.push('      </Paragraph>');
    }

    // Copyright
    if (screenplay.titlePage?.copyright) {
      lines.push('      <Paragraph Alignment="Left">');
      lines.push(`        <Text>${escapeXml(screenplay.titlePage.copyright)}</Text>`);
      lines.push('      </Paragraph>');
    }

    lines.push('    </Content>');
    lines.push('  </TitlePage>');
  }

  // Script content
  lines.push('  <Content>');

  screenplay.elements.forEach((element) => {
    const fdxType = ELEMENT_TO_FDX_TYPE[element.type];
    const content = element.content;

    lines.push(`    <Paragraph Type="${fdxType}">`);
    lines.push(`      <Text>${escapeXml(content)}</Text>`);
    lines.push('    </Paragraph>');
  });

  lines.push('  </Content>');
  lines.push('</FinalDraft>');

  return lines.join('\n');
}

/**
 * Export screenplay as FDX file download
 */
export function exportToFdx(screenplay: Screenplay): void {
  const fdxContent = generateFdx(screenplay);

  // Create blob and download
  const blob = new Blob([fdxContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${screenplay.title || 'screenplay'}.fdx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
