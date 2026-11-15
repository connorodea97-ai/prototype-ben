import { DEPLOYMENT_ID, conversationalContext, customGreeting, overrideConfig, type ThemeId } from "./config.ts";

/**
 * The Tavus element. It fills its parent, so each theme decides the frame:
 * the wrapper must have a definite size (aspect-ratio or explicit height).
 */
export function BenEmbed({ theme, layout = "inline" }: { theme: ThemeId; layout?: "inline" | "full-screen" }) {
  if (!DEPLOYMENT_ID) {
    return (
      <div className="ben-missing">
        Add a Tavus deployment id in <code>src/ben/config.ts</code> to bring Ben to life.
      </div>
    );
  }
  return (
    <tavus-embed
      deployment-id={DEPLOYMENT_ID}
      layout={layout}
      conversational-context={conversationalContext(theme)}
      custom-greeting={customGreeting(theme)}
      override-config={overrideConfig(theme)}
    />
  );
}
