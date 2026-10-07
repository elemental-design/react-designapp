import { css, html } from 'react-strict-dom';
import type { MDXComponents } from 'mdx/types.js';
import { Children, createContext, useContext, type ReactNode } from 'react';

const styles = css.create({
  document: { boxSizing: 'border-box', width: 960, padding: 64, backgroundColor: '#ffffff', color: '#172b3a', fontFamily: 'Arial', fontSize: 22 },
  heading: { fontSize: 48, fontWeight: '700', marginTop: 0, marginBottom: 24 },
  subheading: { fontSize: 30, fontWeight: '700', marginTop: 24, marginBottom: 16 },
  paragraph: { fontSize: 22, marginTop: 0, marginBottom: 20 },
  list: { marginTop: 0, marginBottom: 20 },
  item: { flexDirection: 'row', marginBottom: 12 },
  marker: { width: 30, flexShrink: 0 },
  itemText: { flexGrow: 1, flexBasis: 0, fontSize: 22 },
  accent: { color: '#3957dc' },
  notice: { boxSizing: 'border-box', padding: 24, marginBottom: 20, backgroundColor: '#edf1fa', borderLeftWidth: 4, borderLeftColor: '#3957dc' },
  code: { fontFamily: 'Menlo', fontSize: 18, color: '#172b3a' },
  codeBlock: { padding: 24, marginBottom: 20, backgroundColor: '#edf1fa' },
  rule: { height: 1, marginTop: 12, marginBottom: 24, backgroundColor: '#d8deea' },
});

export function DocumentLayout({ children }: { children?: ReactNode }) {
  return <html.main style={styles.document}>{children}</html.main>;
}
export function Notice({ children }: { children?: ReactNode }) {
  return <html.aside style={styles.notice}><html.p style={styles.paragraph}>{children}</html.p></html.aside>;
}
const Marker = createContext('•');
function List({ children, ordered = false, start = 1 }: { children?: ReactNode; ordered?: boolean; start?: number }) {
  const Tag = ordered ? html.ol : html.ul;
  return <Tag style={styles.list}>{Children.toArray(children).map((child, index) =>
    <Marker.Provider key={index} value={ordered ? `${start + index}.` : '•'}>{child}</Marker.Provider>)}</Tag>;
}
function ListItem({ children }: { children?: ReactNode }) {
  const marker = useContext(Marker);
  return <html.li style={styles.item}><html.span style={styles.marker}>{marker}</html.span><html.span style={styles.itemText}>{children}</html.span></html.li>;
}
export const components: MDXComponents = {
  h1: props => <html.h1 {...props} style={styles.heading} />,
  h2: props => <html.h2 {...props} style={styles.subheading} />,
  h3: props => <html.h3 {...props} style={styles.subheading} />,
  h4: html.h4, h5: html.h5, h6: html.h6,
  p: props => <html.p {...props} style={styles.paragraph} />,
  ul: List,
  ol: props => <List {...props} ordered />,
  li: ListItem,
  strong: props => <html.strong {...props} style={styles.accent} />,
  em: html.em, a: html.a, br: html.br, del: html.del,
  hr: props => <html.hr {...props} style={styles.rule} />,
  pre: props => <html.div {...props} style={styles.codeBlock} />,
  code: props => <html.code {...props} style={styles.code} />,
  blockquote: Notice, img: html.img,
};
