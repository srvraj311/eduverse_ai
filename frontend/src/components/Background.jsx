import { useEffect, useMemo, useState } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Apple system colours: a "knowledge constellation" of glowing nodes joined by thin links.
const COLORS = ["#0a84ff", "#bf5af2", "#30d158", "#ff9f0a", "#ff375f", "#64d2ff"];

function useTheme() {
  const read = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const update = () => setTheme(read());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", update);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);
  return theme;
}

export default function Background() {
  const theme = useTheme();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: 90, density: { enable: true, area: 800 } },
        paint: { fill: { enable: true, color: { value: COLORS } } },
        links: { enable: true, distance: 150, color: { value: "random" }, opacity: theme === "light" ? 0.35 : 0.3, width: 1.2 },
        move: { enable: !reduced, speed: 0.55, outModes: { default: "bounce" } },
        opacity: { value: { min: 0.55, max: 1 }, animation: { enable: !reduced, speed: 0.6, sync: false } },
        size: { value: { min: 2, max: 5 } },
              },
      interactivity: {
        detectsOn: "window",
        events: { onHover: { enable: !reduced, mode: ["grab", "bubble"] }, onClick: { enable: !reduced, mode: "push" } },
        modes: {
          grab: { distance: 180, links: { opacity: 0.55 } },
          bubble: { distance: 160, size: 6, duration: 1.2, opacity: 1 },
          push: { quantity: 3 },
        },
      },
    }),
    [theme, reduced],
  );

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <ParticlesProvider init={loadSlim}>
        <Particles id="constellation" options={options} className="bg-particles" />
      </ParticlesProvider>
    </div>
  );
}
