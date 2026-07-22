/*!
 * IdeaRoads embeddable widget.
 *
 * Usage — inline (renders where the script tag is, or into a named container):
 *   <script src="https://yourapp.example/widget.js"
 *           data-workspace="acme"
 *           data-board="feature-requests"></script>
 *
 *   <div id="my-widget"></div>
 *   <script src="https://yourapp.example/widget.js"
 *           data-workspace="acme"
 *           data-board="feature-requests"
 *           data-container="my-widget"></script>
 *
 * Usage — floating launcher button:
 *   <script src="https://yourapp.example/widget.js"
 *           data-workspace="acme"
 *           data-board="feature-requests"
 *           data-mode="button"
 *           data-position="bottom-right"
 *           data-width="380"
 *           data-height="560"
 *           data-theme="light"
 *           data-accent-color="#2563eb"></script>
 *
 * data-workspace and data-board are both required — omitting either shows a
 * small "configuration error" notice in place of the widget (no iframe, no
 * navigation) — check the console for details. Settings → Embed always
 * generates both for you. data-position, data-width, data-height,
 * data-theme and data-accent-color are all optional and are generated for
 * you by Settings → Embed.
 */
(() => {
  const MESSAGE_SOURCE = "idearoads-widget";
  const script = document.currentScript;

  if (!script) {
    // Can't self-identify (e.g. script was injected in a way that clears
    // currentScript before this runs) — nothing safe to do.
    return;
  }

  const workspace = script.getAttribute("data-workspace");
  if (!workspace) {
    console.error("[IdeaRoads widget] data-workspace attribute is required");
    renderConfigError(
      script,
      "Feedback widget: missing data-workspace — re-copy the install snippet."
    );
    return;
  }

  const board = script.getAttribute("data-board");
  if (!board) {
    // There's no public page at the bare workspace root, so this would
    // otherwise silently load a 404 inside the iframe. Settings → Embed
    // always generates data-board now — this only fires for a hand-edited
    // or stale snippet (e.g. the configured board was later deleted).
    console.error(
      '[IdeaRoads widget] data-board attribute is required (e.g. data-board="feature-requests"). Re-copy the snippet from Settings → Embed.'
    );
    renderConfigError(
      script,
      "Feedback widget: missing data-board — re-copy the install snippet."
    );
    return;
  }

  const mode =
    script.getAttribute("data-mode") === "button" ? "button" : "inline";
  const containerId = script.getAttribute("data-container");

  const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];
  const position = POSITIONS.includes(script.getAttribute("data-position"))
    ? script.getAttribute("data-position")
    : "bottom-right";

  const theme = ["light", "dark"].includes(script.getAttribute("data-theme"))
    ? script.getAttribute("data-theme")
    : null;

  const accentColor = /^#[0-9a-fA-F]{6}$/.test(
    script.getAttribute("data-accent-color") || ""
  )
    ? script.getAttribute("data-accent-color")
    : null;

  const panelWidth = Number(script.getAttribute("data-width")) || 380;
  const panelHeight = Number(script.getAttribute("data-height")) || 560;

  const instanceId = "ir-widget-" + Math.random().toString(36).slice(2, 9);

  const origin = (() => {
    const a = document.createElement("a");
    a.href = script.src;
    return a.protocol + "//" + a.host;
  })();

  const path =
    "/" +
    encodeURIComponent(workspace) +
    (board ? "/b/" + encodeURIComponent(board) : "");
  const iframeQuery = new URLSearchParams({ embed: "1" });
  if (theme) {
    iframeQuery.set("theme", theme);
  }
  if (accentColor) {
    // Strip the "#" for the query string — it's a URL fragment delimiter,
    // and this value round-trips through the sign-in redirect and Better
    // Auth's magic-link email link. lib/embed/style.ts re-adds it on read.
    iframeQuery.set("accentColor", accentColor.slice(1));
  }
  if (mode === "button") {
    // Tells the embedded page it's rendering inside the fixed-size floating
    // panel (as opposed to an inline embed that grows to fit its content) —
    // lib/embed/style.ts uses this to switch to a fixed-height layout with
    // its own internal scroll region instead of letting the page grow past
    // the panel and rely on the iframe's own document scrollbar.
    iframeQuery.set("layout", "panel");
  }
  const iframeSrc = origin + path + "?" + iframeQuery.toString();

  // CSS corner offsets for the floating panel and its launcher button.
  function cornerCss(inset) {
    const vertical = position.startsWith("bottom")
      ? "bottom:" + inset + "px;"
      : "top:" + inset + "px;";
    const horizontal = position.endsWith("left") ? "left:24px;" : "right:24px;";
    return vertical + horizontal;
  }

  // Injected once per page (even with multiple widget instances) — the
  // loading spinner keyframes, a visible keyboard-focus ring for the
  // launcher (inline styles can't express :focus-visible or a media query),
  // and a small-screen layout for the floating panel so it reads as a
  // proper bottom sheet on phones instead of a cramped fixed-size box.
  function injectStylesOnce() {
    if (document.getElementById("ir-widget-styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "ir-widget-styles";
    style.textContent =
      "@keyframes ir-widget-spin{to{transform:rotate(360deg)}}" +
      ".ir-widget-spinner{position:absolute;top:50%;left:50%;width:28px;height:28px;" +
      "margin:-14px 0 0 -14px;border:3px solid rgba(0,0,0,0.12);" +
      "border-top-color:rgba(0,0,0,0.4);border-radius:50%;" +
      "animation:ir-widget-spin 0.7s linear infinite;}" +
      ".ir-widget-launcher{transition:transform 0.15s ease,box-shadow 0.15s ease;}" +
      ".ir-widget-launcher:hover{transform:scale(1.06);" +
      "box-shadow:0 6px 20px rgba(0,0,0,0.25),0 0 0 2px var(--ir-launcher-color,#111);}" +
      ".ir-widget-launcher:active{transform:scale(0.94);" +
      "box-shadow:0 2px 8px rgba(0,0,0,0.2),0 0 0 2px var(--ir-launcher-color,#111);}" +
      ".ir-widget-launcher:focus-visible{outline:2px solid #2563eb;outline-offset:2px;" +
      "box-shadow:0 4px 14px rgba(0,0,0,0.2),0 0 0 4px rgba(37,99,235,0.5);}" +
      ".ir-widget-close{transition:background 0.15s ease;}" +
      ".ir-widget-close:hover{background:#fff;}" +
      ".ir-widget-close:focus-visible{outline:2px solid #2563eb;outline-offset:2px;}" +
      // top and bottom are both pinned (instead of anchoring from the
      // bottom alone with an implicit top) so the panel gets a matching
      // margin on both edges — height is left to resolve automatically
      // from that span rather than a fixed/viewport-relative value that
      // could leave one edge flush against the screen.
      "@media (max-width:480px){.ir-widget-panel{left:12px!important;right:12px!important;" +
      "top:16px!important;bottom:16px!important;width:auto!important;" +
      "height:auto!important;max-width:none!important;max-height:none!important;}}";
    document.head.appendChild(style);
  }

  function createIframe() {
    const iframe = document.createElement("iframe");
    iframe.src = iframeSrc;
    iframe.title = "Feedback";
    iframe.setAttribute("data-idearoads-widget", "");
    iframe.setAttribute("loading", "lazy");
    iframe.style.cssText =
      "display:block;width:100%;border:none;height:" +
      panelHeight +
      "px;max-width:" +
      panelWidth +
      "px;background:transparent;opacity:0;transition:opacity 0.2s ease;";
    return iframe;
  }

  // Wraps an iframe with a centered loading spinner that fades out (and is
  // removed) once the iframe finishes loading. `fillHeight` is used for the
  // floating panel, where the wrapper needs to fill a fixed-size container
  // rather than size to its own content.
  function withLoadingSpinner(iframe, fillHeight) {
    injectStylesOnce();
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:relative;width:100%;" + (fillHeight ? "height:100%;" : "");
    const spinner = document.createElement("div");
    spinner.className = "ir-widget-spinner";
    wrapper.appendChild(spinner);
    wrapper.appendChild(iframe);
    iframe.addEventListener("load", () => {
      iframe.style.opacity = "1";
      spinner.remove();
    });
    return wrapper;
  }

  // Listens for this widget's own iframe reporting its content height, and
  // ignores every other postMessage (from this iframe before it's loaded, or
  // from anything else on the page) by checking both a namespaced payload
  // shape and the message's source window.
  function listenForResize(iframe) {
    window.addEventListener("message", (event) => {
      if (event.source !== iframe.contentWindow) {
        return;
      }
      const data = event.data;
      if (!data || data.source !== MESSAGE_SOURCE || data.type !== "resize") {
        return;
      }
      const height = Number(data.height);
      if (Number.isFinite(height) && height > 0) {
        iframe.style.height = height + "px";
      }
    });
  }

  // Small X button pinned to the panel's own top-right corner, independent
  // of which screen corner data-position floats the panel in — the panel's
  // content (e.g. the sign-in form) has no header of its own to put a close
  // affordance in, and the launcher button alone isn't a discoverable way to
  // close it.
  function createCloseButton(onClose) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ir-widget-close";
    button.setAttribute("aria-label", "Close feedback panel");
    button.style.cssText =
      "position:absolute;top:8px;right:8px;width:28px;height:28px;padding:0;" +
      "display:flex;align-items:center;justify-content:center;" +
      "background:rgba(255,255,255,0.9);border:none;border-radius:50%;" +
      "box-shadow:0 1px 4px rgba(0,0,0,0.15);color:#111;line-height:1;" +
      "cursor:pointer;z-index:1;";
    button.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
      '<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      "</svg>";
    button.addEventListener("click", onClose);
    return button;
  }

  // Renders a small visible notice in place of the widget — used only for a
  // broken install (missing required config), never for a normal runtime
  // error, so a site owner sees *something* actionable instead of a blank
  // gap or a 404 quietly loading inside an iframe.
  function renderConfigError(scriptEl, message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText =
      "font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;" +
      "color:#991b1b;background:#fef2f2;border:1px solid #fecaca;" +
      "border-radius:6px;padding:10px 12px;max-width:420px;";
    const targetContainerId = scriptEl.getAttribute("data-container");
    const container = targetContainerId
      ? document.getElementById(targetContainerId)
      : null;
    if (container) {
      container.appendChild(el);
    } else if (scriptEl.parentNode) {
      scriptEl.parentNode.insertBefore(el, scriptEl.nextSibling);
    }
  }

  function mountInline() {
    const iframe = createIframe();
    const wrapper = withLoadingSpinner(iframe, false);
    const container = containerId ? document.getElementById(containerId) : null;

    if (container) {
      container.appendChild(wrapper);
    } else if (script.parentNode) {
      script.parentNode.insertBefore(wrapper, script.nextSibling);
    } else {
      return;
    }

    listenForResize(iframe);
  }

  function mountFloating() {
    // Guards against a second floating launcher — e.g. a host page/dev
    // environment that ends up running this script twice (double embed
    // snippet, a framework remounting the embedding component, etc.). Only
    // one launcher + panel should ever exist on a page at a time.
    if (document.querySelector(".ir-widget-launcher")) {
      return;
    }

    const iframe = createIframe();
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    iframe.setAttribute("tabindex", "0");

    const launcherColor = accentColor || "#111";

    const panelId = instanceId + "-panel";
    const panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "ir-widget-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Feedback");
    panel.style.cssText =
      "position:fixed;" +
      cornerCss(88) +
      "width:" +
      panelWidth +
      "px;height:" +
      panelHeight +
      "px;" +
      "max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);" +
      "box-shadow:0 8px 30px rgba(0,0,0,0.18);border-radius:12px;" +
      "overflow:hidden;display:none;z-index:2147483000;background:#fff;";
    panel.appendChild(withLoadingSpinner(iframe, true));
    panel.appendChild(createCloseButton(() => setOpen(false)));

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "ir-widget-launcher";
    launcher.setAttribute("aria-label", "Open feedback");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", panelId);
    launcher.style.cssText =
      "position:fixed;" +
      cornerCss(24) +
      "width:56px;height:56px;padding:0;display:flex;" +
      "align-items:center;justify-content:center;" +
      "background:#fff;border:none;border-radius:50%;" +
      "box-shadow:0 4px 14px rgba(0,0,0,0.2),0 0 0 2px " +
      launcherColor +
      ";cursor:pointer;z-index:2147483000;--ir-launcher-color:" +
      launcherColor +
      ";";

    const launcherIcon = document.createElement("img");
    launcherIcon.src = origin + "/logo.png";
    launcherIcon.alt = "";
    launcherIcon.width = 30;
    launcherIcon.height = 30;
    launcherIcon.style.cssText =
      "display:block;width:30px;height:30px;object-fit:contain;pointer-events:none;";
    launcher.appendChild(launcherIcon);

    let open = false;
    let hostOverflow = "";

    // Locks the host page's own scroll while the panel is open — without
    // this, the panel floats over a still-scrollable page, and the page's
    // scrollbar ends up sitting right beside (and fighting with) the panel's
    // own, reading as a broken "double scrollbar".
    function setOpen(next) {
      open = next;
      panel.style.display = open ? "block" : "none";
      launcher.setAttribute("aria-expanded", String(open));
      if (open) {
        hostOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // Wait a frame so display:block has taken effect before focusing —
        // an element that's still display:none can't receive focus.
        requestAnimationFrame(() => iframe.focus());
      } else {
        document.body.style.overflow = hostOverflow;
        launcher.focus();
      }
    }

    launcher.addEventListener("click", () => setOpen(!open));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    });

    // Capture phase so this still fires even if the host page's own click
    // handlers call stopPropagation() before it would otherwise bubble here.
    document.addEventListener(
      "click",
      (event) => {
        if (!open) {
          return;
        }
        if (panel.contains(event.target) || launcher.contains(event.target)) {
          return;
        }
        setOpen(false);
      },
      { capture: true }
    );

    // Soft focus trap: the panel's actual content lives inside a
    // cross-origin iframe, so this page's JS can't see (or intercept) Tab
    // presses happening inside it — a true trap that loops focus within
    // the panel's own focusable elements isn't reachable from here. What
    // *is* reachable: whenever focus lands somewhere else on the host page
    // while the panel is open, using the capture phase means this fires
    // before the host page's own handlers do (best-effort — a host page
    // could still fight it, but that's outside what this widget controls).
    document.addEventListener(
      "focusin",
      (event) => {
        if (!open) {
          return;
        }
        const target = event.target;
        if (
          target === iframe ||
          target === launcher ||
          panel.contains(target)
        ) {
          return;
        }
        iframe.focus();
      },
      true
    );

    document.body.appendChild(panel);
    document.body.appendChild(launcher);
    // The floating panel is a fixed size (configured via data-width/
    // data-height), unlike inline mode — no resize listener here, so the
    // panel doesn't get resized out from under its own chrome.
  }

  function boot() {
    if (mode === "button") {
      mountFloating();
    } else {
      mountInline();
    }
  }

  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
