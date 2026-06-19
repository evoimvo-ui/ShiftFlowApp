import { useState } from "react";
import { useTranslation } from 'react-i18next';

const tabs = [
  { id: "login" },
  { id: "admin" },
  { id: "workers" },
  { id: "schedule" },
];

function Badge({ type }) {
  const { t } = useTranslation();
  if (type === "admin") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-4 uppercase tracking-wide bg-emerald-100 text-emerald-800">
        🛡 {t('userManual.badgeAdmin')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-4 uppercase tracking-wide bg-blue-100 text-blue-800">
      👤 {t('userManual.badgeWorker')}
    </span>
  );
}

function InfoBox({ children }) {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 text-sm text-blue-900 leading-relaxed">
      <span className="mt-0.5 text-blue-500 shrink-0">ℹ️</span>
      <p className="m-0">{children}</p>
    </div>
  );
}

function WarningBox({ children }) {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4 text-sm text-amber-900 leading-relaxed">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <p className="m-0">{children}</p>
    </div>
  );
}

function Step({ num, title, desc, children, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return (
    <div className="mb-5">
      <div className="flex items-start gap-3 mb-1">
        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${colors[color]}`}>
          {num}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          {desc && <p className="text-sm text-[var(--text-secondary)]">{desc}</p>}
        </div>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}

export default function UserManualPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Translate tab labels
  const translatedTabs = tabs.map(tab => ({
    ...tab,
    label: t(`userManual.tabs.${tab.id}`)
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">{t('userManual.title')}</h1>

      <div className="flex border-b border-[var(--border)] mb-6">
        {translatedTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="manual-content">
        {activeTab === "login" && (
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">{t('userManual.login.title')}</h2>
            <p className="text-[var(--text-secondary)] mb-6">{t('userManual.login.intro')}</p>

            <Step num={1} title={t('userManual.login.step1.title')} desc={t('userManual.login.step1.desc')}>
              <p className="text-[var(--text-secondary)] mb-2">{t('userManual.login.step1.content1')}</p>
              <InfoBox>{t('userManual.login.step1.info1')}</InfoBox>
            </Step>
            <Step num={2} title={t('userManual.login.step2.title')} desc={t('userManual.login.step2.desc')} color="blue">
              <p className="text-[var(--text-secondary)] mb-2">{t('userManual.login.step2.content1')}</p>
              <WarningBox>{t('userManual.login.step2.warning1')}</WarningBox>
            </Step>
          </div>
        )}
        {activeTab === "admin" && (
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">{t('userManual.admin.title')}</h2>
            <p className="text-[var(--text-secondary)] mb-6">{t('userManual.admin.intro')}</p>
            <Badge type="admin" />
            {/* Add more admin specific steps here */}
          </div>
        )}
        {activeTab === "workers" && (
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">{t('userManual.workers.title')}</h2>
            <p className="text-[var(--text-secondary)] mb-6">{t('userManual.workers.intro')}</p>
            <Badge type="worker" />
            {/* Add more worker specific steps here */}
          </div>
        )}
        {activeTab === "schedule" && (
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">{t('userManual.schedule.title')}</h2>
            <p className="text-[var(--text-secondary)] mb-6">{t('userManual.schedule.intro')}</p>
            {/* Add more schedule specific steps here */}
          </div>
        )}
      </div>
    </div>
  );
}