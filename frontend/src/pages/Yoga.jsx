import ChakraStage from "../components/ChakraStage.jsx";

export default function Yoga({ onNavigate }) {
  return (
    <div className="yoga-page hub">
      <ChakraStage side={true} />

      <div className="yoga-content hub-wrap">
        <div className="hub-col">

          <button
            type="button"
            className="yoga-back"
            onClick={function () {
              onNavigate("dashboard");
            }}
          >
            Back to dashboard
          </button>

          <h1 className="yoga-serif">Yoga for where you are</h1>

          <p>
            Seven energy points, four paths. Choose what your body is asking
            for today.
          </p>

          <nav className="hub-tiles">

            <button
              type="button"
              className="hub-tile theme-rose"
              onClick={function () {
                onNavigate("yoga-period-pain");
              }}
            >
              <h2 className="yoga-serif">Period pain</h2>
              <p>
                Slow, supported poses for cramps and a tired lower back.
              </p>
            </button>

            <button
              type="button"
              className="hub-tile theme-green"
              onClick={function () {
                onNavigate("yoga-pcos");
              }}
            >
              <h2 className="yoga-serif">PCOS</h2>
              <p>
                Strength and hip work to keep your cycle and energy steady.
              </p>
            </button>

            <button
              type="button"
              className="hub-tile theme-aqua"
              onClick={function () {
                onNavigate("yoga-menopause");
              }}
            >
              <h2 className="yoga-serif">Menopause</h2>
              <p>
                Cooling poses and breath for hot flashes and restless nights.
              </p>
            </button>

            <button
              type="button"
              className="hub-tile theme-amber"
              onClick={function () {
                onNavigate("yoga-diet");
              }}
            >
              <h2 className="yoga-serif">Food and diet</h2>
              <p>
                What to eat, how to handle cravings, and what to swap for
                junk.
              </p>
            </button>

          </nav>
        </div>
      </div>
    </div>
  );
}