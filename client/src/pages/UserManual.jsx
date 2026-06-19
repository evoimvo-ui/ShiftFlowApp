import { useState } from "react";
import { useTranslation } from "react-i18next";

const TAB_IDS = ["login", "admin", "workers", "schedule"];

// ── Shared UI helpers ─────────────────────────────────────────

function Badge({ type }) {
  const { t } = useTranslation();
  if (type === "admin") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-4 uppercase tracking-wide bg-emerald-100 text-emerald-800">
        🛡 {t("userManual.badgeAdmin")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-4 uppercase tracking-wide bg-blue-100 text-blue-800">
      👤 {t("userManual.badgeWorker")}
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
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 ${colors[color]}`}
        >
          {num}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug m-0">
            {title}
          </h3>
          {desc && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 m-0">{desc}</p>
          )}
        </div>
      </div>
      {children && <div className="pl-9">{children}</div>}
    </div>
  );
}

function Li({ children }) {
  return (
    <li className="text-sm text-[var(--text-secondary)] leading-relaxed mb-1">
      {children}
    </li>
  );
}

function Ul({ children }) {
  return <ul className="list-disc pl-4 mt-1 space-y-1">{children}</ul>;
}

function Divider() {
  return <hr className="border-t border-[var(--border)] my-4" />;
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mt-5 mb-3">
      {children}
    </p>
  );
}

function Code({ children }) {
  return (
    <code className="font-mono text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function OptionCard({ icon, title, children }) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-4 mb-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Ol({ children }) {
  return <ol className="list-decimal pl-4 space-y-1">{children}</ol>;
}

// ── Tab panels ────────────────────────────────────────────────

function LoginTab() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <OptionCard icon="🧪" title={t("userManual.login.demoCard.title")}>
          <Ol>
            <Li>{t("userManual.login.demoCard.step1")}</Li>
            <Li>
              {t("userManual.login.demoCard.step2pre")}{" "}
              <strong>{t("userManual.login.demoCard.step2btn")}</strong>
            </Li>
            <Li>{t("userManual.login.demoCard.step3")}</Li>
          </Ol>
        </OptionCard>

        <OptionCard icon="🏢" title={t("userManual.login.orgCard.title")}>
          <Ol>
            <Li>
              {t("userManual.login.orgCard.step1pre")}{" "}
              <strong>{t("userManual.login.orgCard.step1btn")}</strong>
            </Li>
            <Li>{t("userManual.login.orgCard.step2")}</Li>
            <Li>{t("userManual.login.orgCard.step3")}</Li>
          </Ol>
        </OptionCard>
      </div>

      <OptionCard icon="👤" title={t("userManual.login.workerCard.title")}>
        <Ol>
          <Li>
            {t("userManual.login.workerCard.step1pre")}{" "}
            <strong>{t("userManual.login.workerCard.step1btn")}</strong>
          </Li>
          <Li>{t("userManual.login.workerCard.step2")}</Li>
          <Li>
            {t("userManual.login.workerCard.step3pre")}{" "}
            <strong>{t("userManual.login.workerCard.step3btn")}</strong>
          </Li>
        </Ol>
      </OptionCard>

      <InfoBox>{t("userManual.login.tosInfo")}</InfoBox>
    </div>
  );
}

function AdminTab() {
  const { t } = useTranslation();
  return (
    <div>
      <Badge type="admin" />

      <Step
        num={1}
        title={t("userManual.admin.step1.title")}
        desc={t("userManual.admin.step1.desc")}
      >
        <Ul>
          <Li>
            <strong>{t("userManual.admin.step1.item1label")}</strong>{" "}
            {t("userManual.admin.step1.item1text")}{" "}
            <strong>{t("userManual.admin.step1.item1format")}</strong>{" "}
            ({t("userManual.admin.step1.item1example")}{" "}
            <Code>blue-cat-123</Code>)
          </Li>
          <Li>
            <strong>{t("userManual.admin.step1.item2label")}</strong>{" "}
            {t("userManual.admin.step1.item2text")}
          </Li>
        </Ul>
      </Step>

      <Divider />

      <Step
        num={2}
        title={t("userManual.admin.step2.title")}
        desc={t("userManual.admin.step2.desc")}
      >
        <Ul>
          <Li>
            {t("userManual.admin.step2.item1pre")}{" "}
            <strong>{t("userManual.admin.step2.item1btn")}</strong>
          </Li>
          <Li>
            {t("userManual.admin.step2.item2pre")}{" "}
            <strong>{t("userManual.admin.step2.item2val")}</strong>
          </Li>
          <Li>
            {t("userManual.admin.step2.item3pre")}{" "}
            <strong>{t("userManual.admin.step2.item3val")}</strong>
          </Li>
          <Li>
            {t("userManual.admin.step2.item4pre")}{" "}
            <strong>{t("userManual.admin.step2.item4val1")}</strong>{" "}
            {t("userManual.admin.step2.item4and")}{" "}
            <strong>{t("userManual.admin.step2.item4val2")}</strong>
          </Li>
          <Li>
            {t("userManual.admin.step2.item5pre")}{" "}
            <strong>{t("userManual.admin.step2.item5btn")}</strong>
            {t("userManual.admin.step2.item5suf")}
          </Li>
        </Ul>
      </Step>

      <Divider />

      <Step
        num={3}
        title={t("userManual.admin.step3.title")}
        desc={t("userManual.admin.step3.desc")}
      >
        <Ul>
          <Li>
            {t("userManual.admin.step3.item1pre")}{" "}
            <strong>{t("userManual.admin.step3.item1path")}</strong>
          </Li>
          <Li>
            {t("userManual.admin.step3.item2pre")}{" "}
            <strong>{t("userManual.admin.step3.item2btn")}</strong>
            {t("userManual.admin.step3.item2suf")}
          </Li>
        </Ul>
      </Step>

      <Divider />

      <Step
        num={4}
        title={t("userManual.admin.step4.title")}
        desc={t("userManual.admin.step4.desc")}
      >
        <Ul>
          <Li>
            <strong>{t("userManual.admin.step4.item1label")}</strong>{" "}
            {t("userManual.admin.step4.item1text")}
          </Li>
          <Li>
            <strong>{t("userManual.admin.step4.item2label")}</strong>{" "}
            {t("userManual.admin.step4.item2text")}
          </Li>
          <Li>
            <strong>{t("userManual.admin.step4.item3label")}</strong>{" "}
            {t("userManual.admin.step4.item3text")}
          </Li>
          <Li>
            <strong>{t("userManual.admin.step4.item4label")}</strong>{" "}
            {t("userManual.admin.step4.item4text")}
          </Li>
          <Li>
            <strong>{t("userManual.admin.step4.item5label")}</strong>{" "}
            {t("userManual.admin.step4.item5text")}
          </Li>
          <Li>
            <strong>{t("userManual.admin.step4.item6label")}</strong>{" "}
            {t("userManual.admin.step4.item6text")}
          </Li>
          <Li>
            <strong>{t("userManual.admin.step4.item7label")}</strong>{" "}
            {t("userManual.admin.step4.item7text")}
          </Li>
        </Ul>
      </Step>

      <Divider />

      <Step
        num={5}
        title={t("userManual.admin.step5.title")}
        desc={t("userManual.admin.step5.desc")}
      >
        <Ul>
          <Li>
            {t("userManual.admin.step5.item1pre")}{" "}
            <strong>{t("userManual.admin.step5.item1path")}</strong>
          </Li>
          <Li>
            {t("userManual.admin.step5.item2pre")}{" "}
            <strong>{t("userManual.admin.step5.item2val")}</strong>
          </Li>
        </Ul>
      </Step>
    </div>
  );
}

function WorkersTab() {
  const { t } = useTranslation();
  return (
    <div>
      <Badge type="worker" />

      <InfoBox>
        {t("userManual.workers.infoBox.pre")}{" "}
        <strong>{t("userManual.workers.infoBox.passwordLabel")}</strong>{" "}
        ({t("userManual.workers.infoBox.example")}{" "}
        <Code>blue-cat-123</Code>){" "}
        {t("userManual.workers.infoBox.and")}{" "}
        <strong>{t("userManual.workers.infoBox.usernameLabel")}</strong>{" "}
        {t("userManual.workers.infoBox.suf")}
      </InfoBox>

      <WarningBox>
        {t("userManual.workers.warningBox.pre")}{" "}
        <strong>{t("userManual.workers.warningBox.bold")}</strong>
        {t("userManual.workers.warningBox.suf")}
      </WarningBox>

      <SectionLabel>{t("userManual.workers.sectionLabel")}</SectionLabel>

      <Step
        num={1}
        color="blue"
        title={t("userManual.workers.step1.title")}
      />

      <Step
        num={2}
        color="blue"
        title={t("userManual.workers.step2.title")}
        desc={t("userManual.workers.step2.desc")}
      />

      <Step
        num={3}
        color="blue"
        title={t("userManual.workers.step3.title")}
      >
        <Ul>
          <Li>
            {t("userManual.workers.step3.item1pre")}{" "}
            <strong>{t("userManual.workers.step3.item1btn")}</strong>
          </Li>
          <Li>{t("userManual.workers.step3.item2")}</Li>
          <Li>{t("userManual.workers.step3.item3")}</Li>
          <Li>
            {t("userManual.workers.step3.item4pre")}{" "}
            <strong>{t("userManual.workers.step3.item4btn")}</strong>
          </Li>
        </Ul>
      </Step>

      <Step
        num={4}
        color="blue"
        title={t("userManual.workers.step4.title")}
      >
        <Ul>
          <Li>
            {t("userManual.workers.step4.item1pre")}{" "}
            <strong>{t("userManual.workers.step4.item1btn")}</strong>
          </Li>
          <Li>{t("userManual.workers.step4.item2")}</Li>
          <Li>
            {t("userManual.workers.step4.item3pre")}{" "}
            <strong>{t("userManual.workers.step4.item3btn")}</strong>
          </Li>
          <Li>
            {t("userManual.workers.step4.item4pre")}{" "}
            <strong>{t("userManual.workers.step4.item4bold1")}</strong>{" "}
            {t("userManual.workers.step4.item4mid")}{" "}
            <strong>{t("userManual.workers.step4.item4bold2")}</strong>{" "}
            {t("userManual.workers.step4.item4suf")}
          </Li>
        </Ul>
      </Step>
    </div>
  );
}

function ScheduleTab() {
  const { t } = useTranslation();
  return (
    <div>
      <Badge type="admin" />
      <SectionLabel>{t("userManual.schedule.sectionLabel")}</SectionLabel>

      <Step num={1} title={t("userManual.schedule.step1.title")} />
      <Step num={2} title={t("userManual.schedule.step2.title")} />
      <Step num={3} title={t("userManual.schedule.step3.title")} />
      <Step
        num={4}
        title={t("userManual.schedule.step4.title")}
        desc={t("userManual.schedule.step4.desc")}
      />
      <Step num={5} title={t("userManual.schedule.step5.title")}>
        <Ul>
          <Li>{t("userManual.schedule.step5.item1")}</Li>
          <Li>{t("userManual.schedule.step5.item2")}</Li>
          <Li>
            {t("userManual.schedule.step5.item3pre")}{" "}
            <strong>{t("userManual.schedule.step5.item3bold")}</strong>
          </Li>
        </Ul>
      </Step>
    </div>
  );
}

const PANEL_MAP = {
  login: <LoginTab />,
  admin: <AdminTab />,
  workers: <WorkersTab />,
  schedule: <ScheduleTab />,
};

// ── Main component ────────────────────────────────────────────

export default function UserManualPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TAB_IDS[0]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Hero */}
      <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border)]">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-xl">
          📅
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] m-0">
            {t("userManual.title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] m-0">
            {t("userManual.subtitle")}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t(`userManual.tabs.${id}`)}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>{PANEL_MAP[activeTab]}</div>
    </div>
  );
}