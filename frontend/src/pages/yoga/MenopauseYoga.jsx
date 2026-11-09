import YogaCategory from "../../components/YogaCategory.jsx";

export default function MenopauseYoga({ onNavigate }) {
  return (
    <YogaCategory
      category="MENOPAUSE"
      theme="aqua"
      title="Cool and still"
      subtitle="Cooling poses and breath for hot flashes and restless nights. Tap a card to flip it."
      onNavigate={onNavigate}
    />
  );
}