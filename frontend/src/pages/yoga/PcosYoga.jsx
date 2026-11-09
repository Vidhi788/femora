import YogaCategory from "../../components/YogaCategory.jsx";

export default function PcosYoga({ onNavigate }) {
  return (
    <YogaCategory
      category="PCOS"
      theme="green"
      title="Find your balance"
      subtitle="Poses that build core strength and open the hips. Filter by energy point, then flip a card."
      onNavigate={onNavigate}
    />
  );
}