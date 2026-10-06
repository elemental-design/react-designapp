import * as React from 'react';
import { css, html } from 'react-strict-dom-figma';
import imageSrc from './image';

type StyleProps = { style?: Record<string, unknown> | unknown[] };
type ButtonProps = StyleProps & { children: React.ReactNode };

/** Cross-platform button, using the React Strict DOM reference styles. */
export function Button({ children, style }: ButtonProps) {
  return (
    <html.button style={[styles.pressable, style]} aria-label="Shared button">
      <html.span style={styles.text}>{children}</html.span>
      <html.span style={styles.text}>(shared)</html.span>
    </html.button>
  );
}

const styles = css.create({
  pressable: {
    alignSelf: 'flex-start',
    backgroundColor: 'darkgreen',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    display: 'flex',
    gap: '0.25rem',
    paddingBlock: 8,
    paddingInline: 32,
  },
  text: {
    color: 'white',
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export function Typography({ style }: StyleProps) {
  return (
    <html.section style={[{ color: '#333', fontFamily: 'Arial', gap: 12 }, style]}>
      <html.h1>Strict DOM in Figma</html.h1>
      <html.p>
        Inherited text with <html.strong>bold</html.strong> and <html.em>italic</html.em>
        <html.br />a second line.
      </html.p>
    </html.section>
  );
}

export function Form({ style }: StyleProps) {
  return (
    <html.form style={[{ gap: 8, width: 260 }, style]}>
      <html.label>Name</html.label>
      <html.input
        defaultValue="Ada Lovelace"
        style={{ padding: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#f7f7f7' }}
      />
      <html.textarea
        placeholder="Notes"
        style={{
          height: 60,
          padding: 8,
          borderWidth: 1,
          borderColor: '#ccc',
          backgroundColor: '#f7f7f7',
        }}
      />
    </html.form>
  );
}

export function ImageExample({ style }: StyleProps) {
  // image.ts exports PNG bytes as raw base64; src requires a URL.
  const src = `data:image/png;base64,${imageSrc}`;
  return (
    <html.img
      src={src}
      alt="Embedded image"
      width={64}
      height={64}
      style={[
        { objectFit: 'contain', borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
        style,
      ]}
    />
  );
}

export function Gallery({ style }: StyleProps = {}) {
  return (
    <html.main
      style={[
        { width: 400, padding: 24, gap: 24, fontFamily: 'Arial', backgroundColor: 'white' },
        style,
      ]}
    >
      <Typography />
      <Button>Continue</Button>
      <Form />
      <ImageExample />
    </html.main>
  );
}
