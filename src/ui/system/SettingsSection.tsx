import type { ReactNode } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import type { IconName } from '../common/iconRegistry';

interface SettingsSectionProps {
  title: string;
  icon: IconName;
  children: ReactNode;
}

export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <section className="settings-section">
      <SectionHeading icon={icon}>{title}</SectionHeading>
      <div className="settings-section__card">{children}</div>
    </section>
  );
}
