import chakraBg from "../assets/chakra-bg.png";
import "../styles/yoga.css";

export default function ChakraStage({ side = false }) {
  return (
    <div className="stage" aria-hidden="true">
      <img
        className={side ? "stage-img side" : "stage-img"}
        src={chakraBg}
        alt=""
      />
    </div>
  );
}
