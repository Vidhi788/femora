import YogaCategory from "../../components/YogaCategory.jsx";

export default function PeriodPainYoga({ onNavigate }) {
  return (
    <YogaCategory
      category="PERIOD_PAIN"
      theme="rose"
      title="Soften"
      subtitle="Slow, supported poses for cramps and a tired lower back. Tap a card to flip it."
      onNavigate={onNavigate}
    />
  );
}