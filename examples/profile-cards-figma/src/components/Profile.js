import * as React from 'react';
// This example consumes the built package directly (after `npm run build`
// at the repository root), the same way the headless Figma entrypoint is
// documented to be used (see `docs/guides/backends.md`). Published users of
// `react-sketchapp` would instead write `from 'react-sketchapp/figma'`.
import { Image, View, Text, StyleSheet } from '../../../../lib/figma';
import { colors, fonts, spacing } from '../designSystem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.Haus,
    padding: 20,
    width: 260,
  },
  avatar: {
    height: 220,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  title: fonts['Title 2'],
  subtitle: fonts['Title 3'],
  body: fonts.Body,
});

const Avatar = ({ url }) => <Image source={url} style={styles.avatar} />;

const Title = ({ children }) => <Text style={styles.title}>{children}</Text>;

const Subtitle = ({ children }) => <Text style={styles.subtitle}>{children}</Text>;

const Body = ({ children }) => <Text style={styles.body}>{children}</Text>;

const Profile = (props) => (
  <View name={`Profile: ${props.user.name}`} style={styles.container}>
    <Avatar url={props.user.profile_image_url} />
    <View style={{ marginBottom: spacing }}>
      <Title>{props.user.name}</Title>
      <Subtitle>{`@${props.user.screen_name}`}</Subtitle>
    </View>
    <Body>{props.user.description}</Body>
    <Body>{props.user.location}</Body>
    <Body>{props.user.url}</Body>
  </View>
);

export default Profile;
