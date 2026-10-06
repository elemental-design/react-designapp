import * as React from 'react';
import { Artboard, Document, Page } from 'react-figmaapp';
import { css, html } from 'react-strict-dom-figma';
import { Gallery } from './components';

type Style = Record<string, unknown> | unknown[];
type Styled = { style?: Style };
type Theme = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
};
const light: Theme = {
  background: '#ffffff',
  surface: '#f4f5f7',
  text: '#18212f',
  muted: '#647084',
  border: '#d5dae3',
  accent: '#3559e0',
};
const dark: Theme = {
  background: '#161c28',
  surface: '#232d3d',
  text: '#f4f6fb',
  muted: '#a4b0c3',
  border: '#43516a',
  accent: '#a1b4ff',
};
const styles = css.create({
  stack: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: 'bold', lineHeight: 20 },
  field: {
    height: 48,
    boxSizing: 'border-box',
    borderWidth: 1,
    borderRadius: 10,
    paddingInline: 12,
    justifyContent: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});

function Field({
  label,
  value,
  placeholder,
  hint,
  state = 'default',
  theme = light,
  style,
}: Styled & {
  label: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  state?: 'default' | 'focus' | 'error' | 'success' | 'disabled';
  theme?: Theme;
}) {
  const border =
    state === 'error'
      ? '#c6374a'
      : state === 'focus'
      ? theme.accent
      : state === 'success'
      ? '#167948'
      : theme.border;
  return (
    <html.div style={[{ gap: 6 }, style]} aria-label={`Field / ${state} / ${label}`}>
      <html.label style={[styles.label, { color: theme.muted }]}>{label}</html.label>
      <html.input
        value={value}
        placeholder={placeholder}
        disabled={state === 'disabled'}
        aria-invalid={state === 'error'}
        aria-label={`${label} control`}
        style={[
          styles.field,
          {
            backgroundColor: theme.surface,
            borderColor: border,
            borderWidth: state === 'focus' ? 2 : 1,
            color: state === 'disabled' || !value ? theme.muted : theme.text,
          },
        ]}
      />
      {hint && (
        <html.p
          style={[
            styles.caption,
            {
              color: state === 'error' ? '#c6374a' : state === 'success' ? '#167948' : theme.muted,
            },
          ]}
        >
          {hint}
        </html.p>
      )}
    </html.div>
  );
}

export function InputExamples({ theme = light, style }: Styled & { theme?: Theme }) {
  return (
    <html.div style={[styles.stack, { gap: 14 }, style]}>
      <Field
        theme={theme}
        label="Email address"
        placeholder="you@example.com"
        hint="We only use this for account updates."
      />
      <Field
        theme={theme}
        label="Display name"
        value="Ada Lovelace"
        state="focus"
        hint="Focused / filled"
      />
      <Field
        theme={theme}
        label="Account code"
        value="ALT-2048"
        state="success"
        hint="Account code verified."
      />
      <Field
        theme={theme}
        label="Password"
        value="Too short"
        state="error"
        hint="Use at least 8 characters."
      />
      <Field
        theme={theme}
        label="Workspace"
        value="Personal workspace"
        state="disabled"
        hint="Disabled / read only"
      />
    </html.div>
  );
}

function MenuItem({
  label,
  subtitle,
  value,
  selected,
  danger,
  disabled,
  style,
}: Styled & {
  label: string;
  subtitle?: string;
  value?: string;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <html.div
      role="menuitem"
      aria-disabled={disabled}
      aria-label={`Menu item / ${label}`}
      style={[
        styles.row,
        {
          padding: 14,
          backgroundColor: selected ? '#eaf0ff' : light.background,
          boxSizing: 'border-box',
        },
        style,
      ]}
    >
      <html.div style={{ flexGrow: 1, flexBasis: 0, gap: 4 }}>
        <html.span
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: danger ? '#c6374a' : disabled ? light.muted : light.text,
          }}
        >
          {label}
        </html.span>
        {subtitle && (
          <html.span style={[styles.caption, { color: light.muted }]}>{subtitle}</html.span>
        )}
      </html.div>
      {value && <html.span style={[styles.caption, { color: light.muted }]}>{value}</html.span>}
      <html.span style={{ color: light.muted }}>{selected ? 'Selected' : '>'}</html.span>
    </html.div>
  );
}

export function MenuExamples({ style }: Styled) {
  return (
    <html.div style={[styles.stack, style]}>
      <html.span style={[styles.label, { color: light.muted }]}>ACCOUNT</html.span>
      <html.div
        role="menu"
        aria-label="Rounded menu card"
        style={{
          borderWidth: 1,
          borderColor: light.border,
          borderRadius: 14,
          overflow: 'hidden',
          gap: 1,
          backgroundColor: light.border,
        }}
      >
        <MenuItem label="Profile" subtitle="Name, avatar and account details" />
        <MenuItem label="Appearance" value="System" selected />
        <MenuItem label="Notifications" value="On" />
        <MenuItem label="Connected devices" subtitle="Manage your trusted devices" value="3" />
      </html.div>
      <html.span style={[styles.label, { color: light.muted }]}>WORKSPACE</html.span>
      <html.div
        role="menu"
        aria-label="Rounded menu card"
        style={{
          borderWidth: 1,
          borderColor: light.border,
          borderRadius: 14,
          overflow: 'hidden',
          gap: 1,
          backgroundColor: light.border,
        }}
      >
        <MenuItem label="Invite a teammate" disabled subtitle="Available on the team plan" />
        <MenuItem label="Sign out" danger />
      </html.div>
    </html.div>
  );
}

function Radio({
  label,
  description,
  selected = false,
  disabled = false,
  style,
}: Styled & {
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <html.button
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      aria-label={`Radio / ${label}`}
      style={[
        styles.stack,
        {
          gap: 6,
          padding: 14,
          borderWidth: 1,
          borderRadius: 12,
          borderColor: selected ? light.accent : light.border,
          backgroundColor: selected ? '#eef2ff' : disabled ? light.surface : light.background,
        },
        style,
      ]}
    >
      <html.div style={styles.row}>
        <html.div
          aria-label={selected ? 'Radio selected' : 'Radio unselected'}
          style={{
            display: 'flex',
            width: 18,
            height: 18,
            boxSizing: 'border-box',
            borderRadius: 9,
            borderWidth: 1,
            borderColor: selected ? light.accent : light.muted,
            backgroundColor: selected ? light.accent : light.background,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <html.div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: selected ? 'white' : light.background,
            }}
          />
        </html.div>
        <html.span style={[styles.label, { color: disabled ? light.muted : light.text }]}>
          {label}
        </html.span>
      </html.div>
      {description && (
        <html.span style={[styles.caption, { color: light.muted, paddingLeft: 30 }]}>
          {description}
        </html.span>
      )}
    </html.button>
  );
}

export function RadioExamples({ style }: Styled) {
  return (
    <html.div role="radiogroup" style={[styles.stack, style]}>
      <html.p style={[styles.label, { color: light.muted }]}>Choose how files are received</html.p>
      <Radio
        label="Ask every time"
        description="Review each transfer before accepting it."
        selected
      />
      <Radio label="Trusted devices only" description="Automatically accept from paired devices." />
      <Radio label="Everyone nearby" description="Available when discovery is enabled." disabled />
      <html.div style={{ height: 1, backgroundColor: light.border, marginBlock: 8 }} />
      <html.p style={[styles.label, { color: light.muted }]}>Appearance</html.p>
      <Radio label="Light" />
      <Radio label="Dark" selected />
    </html.div>
  );
}

function Switch({
  label,
  description,
  checked,
  disabled,
  style,
}: Styled & {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <html.div style={[styles.row, { paddingBlock: 16 }, style]}>
      <html.div style={{ flexGrow: 1, flexBasis: 0, gap: 6 }}>
        <html.span style={[styles.label, { color: disabled ? light.muted : light.text }]}>
          {label}
        </html.span>
        <html.span style={[styles.caption, { color: light.muted }]}>{description}</html.span>
      </html.div>
      <html.button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        aria-label={`Switch / ${label}`}
        style={{
          display: 'flex',
          width: 44,
          height: 24,
          boxSizing: 'border-box',
          borderWidth: 0,
          borderRadius: 12,
          padding: 2,
          alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
          backgroundColor: disabled ? '#bfc7d5' : checked ? '#167948' : '#8c98ac',
          flexShrink: 0,
        }}
      >
        <html.div
          aria-label="Switch knob"
          style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' }}
        />
      </html.button>
    </html.div>
  );
}

export function SwitchExamples({ style }: Styled) {
  return (
    <html.div style={[styles.stack, style]}>
      <html.div
        style={{ paddingInline: 14, borderWidth: 1, borderColor: light.border, borderRadius: 14 }}
      >
        <Switch
          label="Notifications"
          description="Get notified when a transfer completes."
          checked
        />
        <html.div style={{ height: 1, backgroundColor: light.border }} />
        <Switch
          label="Nearby discovery"
          description="Let other devices find this workspace."
          checked={false}
        />
        <html.div style={{ height: 1, backgroundColor: light.border }} />
        <Switch
          label="Background transfers"
          description="Unavailable while battery saver is on."
          checked
          disabled
        />
      </html.div>
      <html.p style={[styles.caption, { color: light.muted }]}>
        On, off and disabled states use explicit static styles.
      </html.p>
    </html.div>
  );
}

function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
}) {
  const colors = {
    neutral: ['#f4f5f7', '#647084'],
    accent: ['#eef2ff', '#3559e0'],
    success: ['#e8f6ee', '#167948'],
    danger: ['#fdecef', '#c6374a'],
  }[tone];
  return (
    <html.div
      aria-label={`Badge / ${tone}`}
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        backgroundColor: colors[0],
        borderRadius: 20,
        paddingBlock: 6,
        paddingInline: 12,
      }}
    >
      <html.span style={{ color: colors[1], fontSize: 12, fontWeight: 'bold' }}>
        {children}
      </html.span>
    </html.div>
  );
}

export function NavigationExamples({ style }: Styled) {
  return (
    <html.div style={[styles.stack, style]}>
      <html.p style={[styles.label, { color: light.muted }]}>Segmented tabs</html.p>
      <html.div
        role="tablist"
        style={[
          styles.row,
          { gap: 4, padding: 4, borderRadius: 12, backgroundColor: light.surface },
        ]}
      >
        {['Files', 'Devices', 'Activity'].map((label, i) => (
          <html.button
            key={label}
            role="tab"
            aria-selected={i === 0}
            aria-label={`Tab / ${label}`}
            style={{
              flexGrow: 1,
              flexBasis: 0,
              borderWidth: 0,
              borderRadius: 8,
              paddingBlock: 10,
              backgroundColor: i === 0 ? 'white' : light.surface,
              justifyContent: 'center',
            }}
          >
            <html.span
              style={{
                color: i === 0 ? light.accent : light.muted,
                fontSize: 14,
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              {label}
            </html.span>
          </html.button>
        ))}
      </html.div>
      <html.p style={[styles.label, { color: light.muted, marginTop: 12 }]}>Status badges</html.p>
      <html.div style={styles.row}>
        <Badge>Offline</Badge>
        <Badge tone="accent">Connecting</Badge>
      </html.div>
      <html.div style={styles.row}>
        <Badge tone="success">Connected</Badge>
        <Badge tone="danger">Failed</Badge>
      </html.div>
      <html.div
        style={{
          padding: 18,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: light.border,
          gap: 12,
        }}
      >
        <html.span style={styles.label}>MacBook Pro</html.span>
        <html.span style={[styles.caption, { color: light.muted }]}>
          Last seen just now / Trusted device
        </html.span>
        <Badge tone="success">Ready to receive</Badge>
      </html.div>
    </html.div>
  );
}

export function FeedbackExamples({ style }: Styled) {
  return (
    <html.div style={[styles.stack, style]}>
      <html.div
        aria-label="Error banner"
        style={{
          backgroundColor: '#fdecef',
          borderColor: '#c6374a',
          borderWidth: 1,
          borderRadius: 14,
          padding: 16,
          gap: 12,
        }}
      >
        <html.span style={[styles.label, { color: '#c6374a' }]}>Transfer interrupted</html.span>
        <html.p style={{ color: '#c6374a', fontSize: 14, lineHeight: 20 }}>
          The connection was lost. Your files are safe; reconnect to try again.
        </html.p>
        <html.button
          style={{
            alignSelf: 'flex-start',
            paddingBlock: 8,
            paddingInline: 14,
            backgroundColor: '#c6374a',
            borderWidth: 0,
            borderRadius: 8,
          }}
        >
          <html.span style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
            Try again
          </html.span>
        </html.button>
      </html.div>
      <html.div
        aria-label="Success banner"
        style={{ backgroundColor: '#e8f6ee', borderRadius: 14, padding: 16, gap: 8 }}
      >
        <html.span style={[styles.label, { color: '#167948' }]}>All files received</html.span>
        <html.p style={{ color: '#167948', fontSize: 14 }}>3 files saved to Downloads.</html.p>
      </html.div>
      <html.div
        style={{
          borderWidth: 1,
          borderColor: light.border,
          borderRadius: 14,
          padding: 18,
          gap: 12,
        }}
      >
        <html.span style={styles.label}>Sending design-assets.zip</html.span>
        <html.div
          aria-label="Progress track"
          style={{ width: 354, height: 8, borderRadius: 4, backgroundColor: '#e3e7f0' }}
        >
          <html.div
            aria-label="Progress 65 percent"
            style={{ width: 230.1, height: 8, borderRadius: 4, backgroundColor: light.accent }}
          />
        </html.div>
        <html.span style={[styles.caption, { color: light.muted }]}>65% / 13 MB of 20 MB</html.span>
      </html.div>
    </html.div>
  );
}

export const frameNames = [
  '01 / Shared primitives',
  '02 / Inputs - Light',
  '03 / Inputs - Dark',
  '04 / Menu',
  '05 / Radio',
  '06 / Switches',
  '07 / Tabs and badges',
  '08 / Feedback',
];

export function ComponentGallery() {
  const contents = [
    <Gallery style={{ width: 392, padding: 0, boxSizing: 'border-box' }} />,
    <InputExamples />,
    <InputExamples theme={dark} />,
    <MenuExamples />,
    <RadioExamples />,
    <SwitchExamples />,
    <NavigationExamples />,
    <FeedbackExamples />,
  ];
  const descriptions = [
    'Original shared button, text and form',
    'Default, focused, verified, invalid, disabled',
    'The same input states on a dark surface',
    'Grouped rows, selected, disabled and destructive',
    'Selected, unselected and disabled options',
    'On, off and disabled settings',
    'Selected tabs and four status tones',
    'Error, success and transfer progress',
  ];
  return (
    <Document>
      <Page name="Strict DOM / Components">
        {contents.map((content, i) => {
          const theme = i === 2 ? dark : light;
          return (
            <Artboard
              key={frameNames[i]}
              name={frameNames[i]}
              style={{
                position: 'absolute',
                left: (i % 3) * 480,
                top: Math.floor(i / 3) * 700,
                width: 440,
                height: 660,
                backgroundColor: theme.background,
              }}
            >
              <html.div style={{ padding: 24, fontFamily: 'Arial', color: theme.text, gap: 22 }}>
                <html.div style={{ gap: 8 }}>
                  <html.h2 style={{ fontSize: 22, lineHeight: 28 }}>
                    {frameNames[i].slice(5)}
                  </html.h2>
                  <html.p style={[styles.caption, { color: theme.muted }]}>
                    {descriptions[i]}
                  </html.p>
                </html.div>
                {content}
              </html.div>
            </Artboard>
          );
        })}
      </Page>
    </Document>
  );
}
