/* @ds-bundle: {"format":3,"namespace":"S9DesignSystem_874ecb","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"AreaChart","sourcePath":"components/charts/Charts.jsx"},{"name":"BarChart","sourcePath":"components/charts/Charts.jsx"},{"name":"Sparkline","sourcePath":"components/charts/Charts.jsx"},{"name":"Charts","sourcePath":"components/charts/Charts.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"BadgeCount","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"CardHeader","sourcePath":"components/data-display/Card.jsx"},{"name":"StatCard","sourcePath":"components/data-display/StatCard.jsx"},{"name":"Table","sourcePath":"components/data-display/Table.jsx"},{"name":"Divider","sourcePath":"components/display/Divider.jsx"},{"name":"EmptyState","sourcePath":"components/display/EmptyState.jsx"},{"name":"SkeletonLine","sourcePath":"components/display/Skeleton.jsx"},{"name":"SkeletonCircle","sourcePath":"components/display/Skeleton.jsx"},{"name":"SkeletonBlock","sourcePath":"components/display/Skeleton.jsx"},{"name":"SkeletonText","sourcePath":"components/display/Skeleton.jsx"},{"name":"Skeleton","sourcePath":"components/display/Skeleton.jsx"},{"name":"Slider","sourcePath":"components/display/Slider.jsx"},{"name":"Toolbar","sourcePath":"components/display/Toolbar.jsx"},{"name":"Banner","sourcePath":"components/feedback/Banner.jsx"},{"name":"InlineMessage","sourcePath":"components/feedback/Banner.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastProvider","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"Footer","sourcePath":"components/marketing/Footer.jsx"},{"name":"Hero","sourcePath":"components/marketing/Hero.jsx"},{"name":"Accordion","sourcePath":"components/navigation/Accordion.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"ProgressTracker","sourcePath":"components/navigation/ProgressTracker.jsx"},{"name":"NavItem","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"NavSection","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Topbar","sourcePath":"components/navigation/Topbar.jsx"},{"name":"SearchField","sourcePath":"components/navigation/Topbar.jsx"},{"name":"Drawer","sourcePath":"components/overlays/Drawer.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"},{"name":"Popover","sourcePath":"components/overlays/Popover.jsx"},{"name":"DropdownMenu","sourcePath":"components/overlays/Popover.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"0dcbe56a9550","components/buttons/IconButton.jsx":"ced9043157ec","components/charts/Charts.jsx":"d393b6a029ed","components/data-display/Avatar.jsx":"cf53eac19c8b","components/data-display/Badge.jsx":"f78238ec88cd","components/data-display/Card.jsx":"85e478f95318","components/data-display/StatCard.jsx":"d8d6ad8c3423","components/data-display/Table.jsx":"989c5f26c6fb","components/display/Divider.jsx":"bd1a4ca66227","components/display/EmptyState.jsx":"0af82b651d0b","components/display/Skeleton.jsx":"286f392f21d7","components/display/Slider.jsx":"baa845449d58","components/display/Toolbar.jsx":"662bc7ad894a","components/feedback/Banner.jsx":"57aac9af3c2e","components/feedback/Spinner.jsx":"53af2da8b992","components/feedback/Toast.jsx":"4ee03ce5f117","components/feedback/Tooltip.jsx":"6ac3e5340dc7","components/forms/Checkbox.jsx":"ed13f24753ee","components/forms/Input.jsx":"6b8f6d9a27ef","components/forms/Radio.jsx":"6b33832690c7","components/forms/Select.jsx":"ac341df6259e","components/forms/Switch.jsx":"23ea686accd6","components/forms/Textarea.jsx":"d0207822b099","components/icon/Icon.jsx":"fe8835ddb696","components/marketing/Footer.jsx":"01ca01bdde00","components/marketing/Hero.jsx":"2a5ee47c0b0b","components/navigation/Accordion.jsx":"6aab9fac7153","components/navigation/Breadcrumbs.jsx":"1710eb066d57","components/navigation/Pagination.jsx":"675e58c00610","components/navigation/ProgressTracker.jsx":"077eab0ca11d","components/navigation/Sidebar.jsx":"bc23a6aaaf5f","components/navigation/Tabs.jsx":"159995aa05e1","components/navigation/Topbar.jsx":"9d085f229ecd","components/overlays/Drawer.jsx":"e21619f2e9db","components/overlays/Modal.jsx":"c9f763584b58","components/overlays/Popover.jsx":"e085b68bba35"},"inlinedExternals":[],"unexposedExports":[{"name":"useToast","sourcePath":"components/feedback/Toast.jsx"}]} */

(() => {

const __ds_ns = (window.S9DesignSystem_874ecb = window.S9DesignSystem_874ecb || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: {
    height: 34,
    padFont: "0 12px",
    gap: 6,
    font: 14,
    radius: 8,
    icon: 18
  },
  md: {
    height: 42,
    padFont: "0 16px",
    gap: 8,
    font: 16,
    radius: 12,
    icon: 20
  },
  lg: {
    height: 50,
    padFont: "0 20px",
    gap: 8,
    font: 18,
    radius: 12,
    icon: 22
  }
};

// [default, hover, active] background / text / border per style
const STYLES = {
  primary: {
    bg: ["var(--primary-solid)", "var(--primary-solid-hover)", "var(--primary-solid-active)"],
    fg: "var(--primary-on-solid)",
    border: "transparent"
  },
  secondary: {
    bg: ["var(--secondary-solid)", "var(--secondary-solid-hover)", "var(--secondary-solid-active)"],
    fg: "var(--secondary-on-solid)",
    border: "transparent"
  },
  ghost: {
    bg: ["transparent", "var(--secondary-soft-hover)", "var(--secondary-solid)"],
    fg: "var(--content-primary)",
    border: "transparent"
  },
  outline: {
    bg: ["var(--bg-surface)", "var(--secondary-soft)", "var(--secondary-soft-hover)"],
    fg: "var(--content-primary)",
    border: "var(--border-default)"
  },
  danger: {
    bg: ["var(--danger-solid)", "var(--danger-solid-hover)", "var(--danger-solid-active)"],
    fg: "var(--danger-on-solid)",
    border: "transparent"
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  iconOnly = false,
  type = "button",
  style = {},
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = STYLES[variant] || STYLES.primary;
  const idx = disabled ? 0 : active ? 2 : hover ? 1 : 0;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: s.height,
    width: fullWidth ? "100%" : iconOnly ? s.height : undefined,
    padding: iconOnly ? 0 : s.padFont,
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: s.font,
    lineHeight: 1,
    borderRadius: s.radius,
    border: `1px solid ${v.border}`,
    background: disabled ? "var(--secondary-soft)" : v.bg[idx],
    color: disabled ? "var(--content-disabled)" : v.fg,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 120ms ease, transform 80ms ease, box-shadow 120ms ease",
    transform: active && !disabled ? "scale(0.98)" : "scale(1)",
    boxShadow: hover && !disabled && (variant === "outline" || variant === "ghost") ? "none" : "none",
    outline: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    boxSizing: "border-box",
    ...style
  };
  const iconNode = n => n && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded",
    style: {
      fontSize: s.icon,
      lineHeight: 1,
      fontVariationSettings: `'FILL' 0, 'wght' 500, 'opsz' ${s.icon}`
    }
  }, n);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: base
  }, rest), iconNode(leadingIcon), !iconOnly && children, iconNode(trailingIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/charts/Charts.jsx
try { (() => {
const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)", "var(--series-6)"];

/** AreaChart — single-series smooth area+line. data: number[]. */
function AreaChart({
  data = [],
  height = 180,
  color = "var(--series-1)",
  labels,
  style = {}
}) {
  const w = 600,
    h = height,
    pad = 8;
  const max = Math.max(...data, 1),
    min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * stepX, h - pad - (d - min) / range * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  const id = "g" + Math.random().toString(36).slice(2, 7);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    preserveAspectRatio: "none",
    style: {
      width: "100%",
      height,
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: id,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.22"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#${id})`
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinejoin: "round",
    strokeLinecap: "round",
    vectorEffect: "non-scaling-stroke"
  })), labels && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8,
      fontSize: 11,
      color: "var(--content-tertiary)"
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))));
}

/** BarChart — vertical bars (single or grouped). data: number[] or number[][]. */
function BarChart({
  data = [],
  height = 180,
  labels,
  colors = SERIES,
  style = {}
}) {
  const groups = Array.isArray(data[0]) ? data : data.map(d => [d]);
  const max = Math.max(...groups.flat(), 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 12,
      height,
      padding: "0 2px"
    }
  }, groups.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 4,
      height: "100%"
    }
  }, g.map((v, j) => /*#__PURE__*/React.createElement("div", {
    key: j,
    title: `${v}`,
    style: {
      flex: 1,
      maxWidth: 36,
      height: `${v / max * 100}%`,
      minHeight: 4,
      background: colors[j % colors.length],
      borderRadius: "6px 6px 0 0",
      transition: "height 200ms ease"
    }
  }))))), labels && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 8
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      color: "var(--content-tertiary)"
    }
  }, l))));
}

/** Sparkline — tiny inline line, no axes. */
function Sparkline({
  data = [],
  width = 96,
  height = 32,
  color = "var(--series-1)",
  style = {}
}) {
  const max = Math.max(...data, 1),
    min = Math.min(...data, 0),
    range = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);
  const line = data.map((d, i) => `${i ? "L" : "M"}${(i * stepX).toFixed(1)},${(height - (d - min) / range * height).toFixed(1)}`).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: height,
    style: {
      display: "block",
      ...style
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}

/** Charts — namespace export bundling all chart primitives. */
const Charts = {
  AreaChart,
  BarChart,
  Sparkline
};
Object.assign(__ds_scope, { AreaChart, BarChart, Sparkline, Charts });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Charts.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
// color → [soft bg, soft text, solid bg, solid text, outline text/border]
const COLORS = {
  neutral: {
    soft: ["var(--secondary-soft)", "var(--content-secondary)"],
    solid: ["var(--neutral-600)", "var(--white-100)"],
    line: "var(--neutral-500)"
  },
  primary: {
    soft: ["var(--primary-soft)", "var(--primary-on-soft)"],
    solid: ["var(--primary-solid)", "var(--white-100)"],
    line: "var(--primary-solid)"
  },
  success: {
    soft: ["var(--success-soft)", "var(--success-on-soft)"],
    solid: ["var(--success-solid)", "var(--white-100)"],
    line: "var(--success-solid)"
  },
  warning: {
    soft: ["var(--warning-soft)", "var(--warning-on-soft)"],
    solid: ["var(--warning-solid)", "var(--warning-on-solid)"],
    line: "var(--warning-solid)"
  },
  danger: {
    soft: ["var(--danger-soft)", "var(--danger-on-soft)"],
    solid: ["var(--danger-solid)", "var(--white-100)"],
    line: "var(--danger-solid)"
  },
  info: {
    soft: ["var(--info-soft)", "var(--info-on-soft)"],
    solid: ["var(--info-solid)", "var(--white-100)"],
    line: "var(--info-solid)"
  }
};
const SIZES = {
  sm: {
    f: 11,
    py: 2,
    px: 8,
    h: 18
  },
  md: {
    f: 12,
    py: 3,
    px: 10,
    h: 22
  },
  lg: {
    f: 14,
    py: 4,
    px: 12,
    h: 28
  }
};

/** Badge / Tag — compact status or category label. */
function Badge({
  children,
  color = "neutral",
  variant = "soft",
  size = "md",
  leadingIcon,
  dot = false,
  style = {}
}) {
  const c = COLORS[color] || COLORS.neutral;
  const s = SIZES[size] || SIZES.md;
  let bg = "transparent",
    fg = c.line,
    border = "none";
  if (variant === "soft") {
    bg = c.soft[0];
    fg = c.soft[1];
  } else if (variant === "solid") {
    bg = c.solid[0];
    fg = c.solid[1];
  } else if (variant === "outline") {
    bg = "transparent";
    fg = c.line;
    border = `1px solid ${c.line}`;
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: `${s.py}px ${s.px}px`,
      height: s.h,
      borderRadius: 999,
      background: bg,
      color: fg,
      border,
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: s.f,
      lineHeight: 1,
      whiteSpace: "nowrap",
      boxSizing: "border-box",
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "currentColor"
    }
  }), leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded",
    style: {
      fontSize: s.f + 3,
      fontVariationSettings: "'FILL' 1, 'opsz' 20"
    }
  }, leadingIcon), children);
}

/** BadgeCount — circular numeric counter. */
function BadgeCount({
  count = 0,
  color = "primary",
  size = "md",
  max = 99,
  style = {}
}) {
  const c = COLORS[color] || COLORS.primary;
  const dim = {
    sm: 16,
    md: 20,
    lg: 24
  }[size] || 20;
  const f = {
    sm: 10,
    md: 12,
    lg: 13
  }[size] || 12;
  const text = count > max ? `${max}+` : `${count}`;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: dim,
      height: dim,
      padding: text.length > 1 ? "0 6px" : 0,
      borderRadius: 999,
      background: c.solid[0],
      color: c.solid[1],
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: f,
      lineHeight: 1,
      boxSizing: "border-box",
      ...style
    }
  }, text);
}
Object.assign(__ds_scope, { Badge, BadgeCount });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PAD = {
  sm: 16,
  md: 20,
  lg: 24
};

/** Card — surface container. Types: elevated (shadow), outlined (border), filled (sunken). */
function Card({
  children,
  type = "outlined",
  padding = "md",
  radius = 16,
  style = {},
  ...rest
}) {
  const styles = {
    elevated: {
      background: "var(--bg-surface)",
      boxShadow: "0 1px 2px rgba(10,11,13,0.04), 0 8px 24px rgba(10,11,13,0.06)"
    },
    outlined: {
      background: "var(--bg-surface)",
      boxShadow: "inset 0 0 0 1px var(--border-subtle)"
    },
    filled: {
      background: "var(--bg-sunken)"
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: radius,
      padding: PAD[padding] ?? padding,
      boxSizing: "border-box",
      fontFamily: "var(--font-sans)",
      color: "var(--content-primary)",
      ...(styles[type] || styles.outlined),
      ...style
    }
  }, rest), children);
}

/** CardHeader — title + optional subtitle and trailing action. */
function CardHeader({
  title,
  subtitle,
  action,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 16,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--content-primary)"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--content-tertiary)"
    }
  }, subtitle)), action);
}
Object.assign(__ds_scope, { Card, CardHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Table.jsx
try { (() => {
/**
 * Table — columns: [{key,header,align,width,render}], data: row objects.
 * Lightweight, styled to the S9 hairline system.
 */
function Table({
  columns = [],
  data = [],
  dense = false,
  style = {}
}) {
  const cellPad = dense ? "8px 12px" : "12px 16px";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      overflowX: "auto",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      padding: cellPad,
      width: c.width,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      color: "var(--content-tertiary)",
      borderBottom: "1px solid var(--border-default)",
      whiteSpace: "nowrap",
      background: "var(--bg-surface)"
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, data.map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: row.id ?? ri,
    style: {
      transition: "background 100ms ease"
    },
    onMouseEnter: e => e.currentTarget.style.background = "var(--secondary-soft)",
    onMouseLeave: e => e.currentTarget.style.background = "transparent"
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      padding: cellPad,
      color: "var(--content-primary)",
      borderBottom: "1px solid var(--border-subtle)",
      verticalAlign: "middle"
    }
  }, c.render ? c.render(row[c.key], row) : row[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Table.jsx", error: String((e && e.message) || e) }); }

// components/display/Divider.jsx
try { (() => {
/** Divider — horizontal or vertical rule, optional label. */
function Divider({
  label,
  orientation = "horizontal",
  style = {}
}) {
  if (orientation === "vertical") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        height: "100%",
        minHeight: 16,
        background: "var(--border-default)",
        flexShrink: 0,
        alignSelf: "stretch",
        ...style
      }
    });
  }
  if (!label) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 1,
        background: "var(--border-default)",
        flexShrink: 0,
        ...style
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--border-default)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--content-tertiary)",
      fontFamily: "var(--font-sans)",
      whiteSpace: "nowrap"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--border-default)"
    }
  }));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Divider.jsx", error: String((e && e.message) || e) }); }

// components/display/Skeleton.jsx
try { (() => {
const ANIM = `@keyframes s9-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
const shimmerBg = "linear-gradient(90deg, var(--neutral-100) 25%, var(--neutral-200) 50%, var(--neutral-100) 75%)";

/** Base Skeleton pulse. */
function Bone({
  style = {}
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, ANIM), /*#__PURE__*/React.createElement("div", {
    style: {
      background: shimmerBg,
      backgroundSize: "200% 100%",
      animation: "s9-shimmer 1.4s ease infinite",
      borderRadius: 6,
      ...style
    }
  }));
}

/** SkeletonLine — single text-line placeholder. */
function SkeletonLine({
  width = "100%",
  height = 14,
  style = {}
}) {
  return /*#__PURE__*/React.createElement(Bone, {
    style: {
      width,
      height,
      ...style
    }
  });
}

/** SkeletonCircle — avatar/icon placeholder. */
function SkeletonCircle({
  size = 40,
  style = {}
}) {
  return /*#__PURE__*/React.createElement(Bone, {
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      ...style
    }
  });
}

/** SkeletonBlock — rectangular image/card placeholder. */
function SkeletonBlock({
  width = "100%",
  height = 120,
  radius = 10,
  style = {}
}) {
  return /*#__PURE__*/React.createElement(Bone, {
    style: {
      width,
      height,
      borderRadius: radius,
      ...style
    }
  });
}

/** SkeletonText — multi-line paragraph placeholder. lines default 3. */
function SkeletonText({
  lines = 3,
  lastWidth = "60%",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, Array.from({
    length: lines
  }).map((_, i) => /*#__PURE__*/React.createElement(SkeletonLine, {
    key: i,
    width: i === lines - 1 ? lastWidth : "100%"
  })));
}

/** Skeleton — namespace re-export of all skeleton primitives. */
const Skeleton = {
  SkeletonLine,
  SkeletonCircle,
  SkeletonBlock,
  SkeletonText
};
Object.assign(__ds_scope, { SkeletonLine, SkeletonCircle, SkeletonBlock, SkeletonText, Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/display/Slider.jsx
try { (() => {
const {
  useState,
  useRef
} = React;
const SIZES_MAP = {
  sm: {
    h: 4,
    thumb: 16
  },
  md: {
    h: 6,
    thumb: 20
  },
  lg: {
    h: 8,
    thumb: 24
  }
};

/** Slider — single or range value. */
function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  size = "md",
  showValue = false,
  style = {}
}) {
  const s = SIZES_MAP[size] || SIZES_MAP.md;
  const pct = (value - min) / (max - min) * 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, showValue && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "var(--content-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, min), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: "var(--content-primary)"
    }
  }, value), /*#__PURE__*/React.createElement("span", null, max)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      height: s.thumb,
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      height: s.h,
      borderRadius: 999,
      background: "var(--track)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct}%`,
      background: disabled ? "var(--neutral-400)" : "var(--primary-solid)",
      transition: "width 60ms"
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    disabled: disabled,
    onChange: e => onChange && onChange(Number(e.target.value)),
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      width: "100%",
      margin: 0,
      opacity: 0,
      height: s.thumb,
      cursor: disabled ? "not-allowed" : "pointer",
      zIndex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: `calc(${pct}% - ${s.thumb / 2}px)`,
      width: s.thumb,
      height: s.thumb,
      borderRadius: "50%",
      background: "var(--white-100)",
      boxShadow: `0 1px 3px rgba(0,0,0,0.2), inset 0 0 0 2px ${disabled ? "var(--neutral-400)" : "var(--primary-solid)"}`,
      pointerEvents: "none",
      transition: "left 60ms"
    }
  })));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Slider.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
const SIZES = {
  xs: 16,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56
};
const TRACKS = {
  light: "var(--neutral-200)",
  dark: "var(--neutral-800)"
};

/** Spinner — animated loading indicator. */
function Spinner({
  size = "md",
  color = "primary",
  style = {}
}) {
  const d = SIZES[size] || SIZES.md;
  const stroke = color === "white" ? "var(--white-100)" : "var(--primary-solid)";
  const track = color === "white" ? TRACKS.dark : TRACKS.light;
  const sw = Math.max(2, d * 0.12);
  const r = (d - sw) / 2;
  const circ = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("svg", {
    width: d,
    height: d,
    viewBox: `0 0 ${d} ${d}`,
    style: {
      animation: "s9-spin 0.75s linear infinite",
      flexShrink: 0,
      display: "block",
      ...style
    },
    "aria-label": "Loading",
    role: "status"
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes s9-spin{to{transform:rotate(360deg)}}`), /*#__PURE__*/React.createElement("circle", {
    cx: d / 2,
    cy: d / 2,
    r: r,
    fill: "none",
    stroke: track,
    strokeWidth: sw
  }), /*#__PURE__*/React.createElement("circle", {
    cx: d / 2,
    cy: d / 2,
    r: r,
    fill: "none",
    stroke: stroke,
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeDasharray: `${circ * 0.75} ${circ * 0.25}`,
    strokeDashoffset: 0,
    transform: `rotate(-90 ${d / 2} ${d / 2})`
  }));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const {
  useState,
  useRef
} = React;
const DIRECTIONS = {
  top: {
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  },
  bottom: {
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  },
  left: {
    right: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)"
  },
  right: {
    left: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)"
  }
};

/**
 * Tooltip — wraps any child and shows a text tip on hover/focus.
 */
function Tooltip({
  children,
  content,
  direction = "top",
  disabled = false,
  style = {}
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  if (!content || disabled) return children;
  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(true), 300);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setVisible(false);
  };
  const pos = DIRECTIONS[direction] || DIRECTIONS.top;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide
  }, children, visible && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      ...pos,
      zIndex: 1000,
      background: "var(--neutral-900)",
      color: "var(--white-100)",
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: 12,
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      lineHeight: 1.4,
      whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      pointerEvents: "none"
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
const SIZES = {
  sm: 16,
  md: 20,
  lg: 24
};

/** Single radio control. Use RadioGroup for sets. */
function Radio({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  label,
  description,
  name,
  value,
  id,
  style = {}
}) {
  const d = SIZES[size] || SIZES.md;
  const radioId = id || `rb-${Math.random().toString(36).slice(2, 8)}`;
  const dot = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "radio",
    id: radioId,
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(value),
    style: {
      flexShrink: 0,
      width: d,
      height: d,
      borderRadius: "50%",
      border: "none",
      padding: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-surface)",
      boxShadow: checked ? "inset 0 0 0 1.5px var(--primary-solid)" : "inset 0 0 0 1.5px var(--border-strong)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "box-shadow 120ms ease",
      boxSizing: "border-box"
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: d * 0.5,
      height: d * 0.5,
      borderRadius: "50%",
      background: "var(--primary-solid)"
    }
  }));
  if (!label && !description) return dot;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: radioId,
    style: {
      display: "flex",
      alignItems: description ? "flex-start" : "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, dot, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: "var(--content-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--content-tertiary)"
    }
  }, description)));
}

/** RadioGroup — manages selection across options [{value,label,description}]. */
function RadioGroup({
  options = [],
  value,
  onChange,
  size = "md",
  name,
  disabled = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      ...style
    }
  }, options.map(o => /*#__PURE__*/React.createElement(Radio, {
    key: o.value,
    value: o.value,
    checked: value === o.value,
    onChange: onChange,
    disabled: disabled || o.disabled,
    size: size,
    name: name,
    label: o.label,
    description: o.description
  })));
}
Object.assign(__ds_scope, { Radio, RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
const SIZES = {
  sm: {
    w: 36,
    h: 20,
    thumb: 16
  },
  md: {
    w: 44,
    h: 24,
    thumb: 20
  },
  lg: {
    w: 52,
    h: 30,
    thumb: 26
  }
};
const ON = {
  primary: "var(--primary-solid)",
  success: "var(--success-solid)"
};

/** Binary on/off toggle. */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  color = "primary",
  label,
  description,
  id,
  style = {}
}) {
  const s = SIZES[size] || SIZES.md;
  const pad = (s.h - s.thumb) / 2;
  const switchId = id || `sw-${Math.random().toString(36).slice(2, 8)}`;
  const control = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    id: switchId,
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      flexShrink: 0,
      width: s.w,
      height: s.h,
      borderRadius: 999,
      border: "none",
      padding: 0,
      background: checked ? ON[color] || ON.primary : "var(--neutral-500)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      position: "relative",
      transition: "background 150ms ease",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: pad,
      left: checked ? s.w - s.thumb - pad : pad,
      width: s.thumb,
      height: s.thumb,
      borderRadius: "50%",
      background: "var(--white-100)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
      transition: "left 150ms ease"
    }
  }));
  if (!label && !description) return control;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: switchId,
    style: {
      display: "flex",
      alignItems: description ? "flex-start" : "center",
      gap: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, control, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--content-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--content-tertiary)"
    }
  }, description)));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Multi-line text area with label, helper/error text. */
function Textarea({
  label,
  helper,
  error,
  rows = 4,
  disabled = false,
  value,
  defaultValue,
  placeholder,
  onChange,
  resize = "vertical",
  style = {},
  id,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const borderColor = error ? "var(--danger-solid)" : focus ? "var(--border-focus)" : "var(--border-default)";
  const fieldId = id || (label ? `ta-${Math.random().toString(36).slice(2, 8)}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 13,
      color: "var(--content-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: fieldId,
    rows: rows,
    disabled: disabled,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 12,
      border: "none",
      outline: "none",
      background: disabled ? "var(--secondary-soft)" : "var(--bg-surface)",
      boxShadow: `inset 0 0 0 ${focus && !error ? 2 : 1}px ${borderColor}`,
      fontFamily: "var(--font-sans)",
      fontSize: 16,
      lineHeight: 1.5,
      color: "var(--content-primary)",
      resize,
      boxSizing: "border-box",
      opacity: disabled ? 0.6 : 1,
      transition: "box-shadow 120ms ease"
    }
  }, rest)), (error || helper) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? "var(--danger-on-soft)" : "var(--content-tertiary)"
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Icon — renders a Google Material Symbols (Rounded) glyph by name.
 * The S9 icon library is the full Material Icons set; reference any glyph
 * by its Material name, e.g. "check_circle", "expand_more", "search".
 */
function Icon({
  name,
  size = 24,
  fill = false,
  weight = 400,
  grade = 0,
  color,
  className = "",
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `material-symbols-rounded${className ? " " + className : ""}`,
    style: {
      fontSize: size,
      width: size,
      height: size,
      color,
      fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${Math.min(48, Math.max(20, size))}`,
      overflow: "hidden",
      ...style
    },
    "aria-hidden": "true"
  }, rest), name);
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** IconButton — square icon-only button sharing Button's visual language. */
const SIZES = {
  sm: 34,
  md: 42,
  lg: 50
};
const ICON = {
  sm: 18,
  md: 20,
  lg: 22
};
const RADIUS = {
  sm: 8,
  md: 12,
  lg: 12
};
const STYLES = {
  primary: {
    bg: ["var(--primary-solid)", "var(--primary-solid-hover)", "var(--primary-solid-active)"],
    fg: "var(--primary-on-solid)",
    border: "transparent"
  },
  secondary: {
    bg: ["var(--secondary-solid)", "var(--secondary-solid-hover)", "var(--secondary-solid-active)"],
    fg: "var(--secondary-on-solid)",
    border: "transparent"
  },
  ghost: {
    bg: ["transparent", "var(--secondary-soft-hover)", "var(--secondary-solid)"],
    fg: "var(--content-primary)",
    border: "transparent"
  },
  outline: {
    bg: ["var(--bg-surface)", "var(--secondary-soft)", "var(--secondary-soft-hover)"],
    fg: "var(--content-primary)",
    border: "var(--border-default)"
  },
  danger: {
    bg: ["var(--danger-solid)", "var(--danger-solid-hover)", "var(--danger-solid-active)"],
    fg: "var(--danger-on-solid)",
    border: "transparent"
  }
};
function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  disabled = false,
  "aria-label": ariaLabel,
  style = {},
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const v = STYLES[variant] || STYLES.ghost;
  const d = SIZES[size] || SIZES.md;
  const idx = disabled ? 0 : active ? 2 : hover ? 1 : 0;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: d,
      height: d,
      borderRadius: RADIUS[size] || 12,
      border: `1px solid ${v.border}`,
      background: disabled ? "var(--secondary-soft)" : v.bg[idx],
      color: disabled ? "var(--content-disabled)" : v.fg,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 120ms ease, transform 80ms ease",
      transform: active && !disabled ? "scale(0.96)" : "scale(1)",
      outline: "none",
      boxSizing: "border-box",
      padding: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: ICON[size] || 20,
    weight: 500
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64
};
const FONTS = {
  xs: 10,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24
};
const STATUS = {
  online: "var(--success-solid)",
  busy: "var(--danger-solid)",
  away: "var(--warning-solid)",
  offline: "var(--neutral-400)"
};

/** Avatar — photo, initials, or icon. Circle or rounded square, optional status dot. */
function Avatar({
  src,
  name,
  icon,
  size = "md",
  shape = "circle",
  status,
  style = {}
}) {
  const d = SIZES[size] || SIZES.md;
  const radius = shape === "square" ? Math.round(d * 0.28) : "50%";
  const initials = name ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() : "";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex",
      width: d,
      height: d,
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: d,
      height: d,
      borderRadius: radius,
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: src ? "var(--neutral-100)" : "var(--primary-soft)",
      color: "var(--primary-on-soft)",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: FONTS[size] || 15,
      boxSizing: "border-box"
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name || "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: d * 0.55
  }) : initials), status && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: Math.max(8, d * 0.26),
      height: Math.max(8, d * 0.26),
      borderRadius: "50%",
      background: STATUS[status] || STATUS.offline,
      boxShadow: "0 0 0 2px var(--bg-surface)"
    }
  }));
}

/** AvatarGroup — overlapping stack of avatars with optional +N overflow. */
function AvatarGroup({
  children,
  max,
  size = "md",
  style = {}
}) {
  const items = React.Children.toArray(children);
  const shown = max ? items.slice(0, max) : items;
  const extra = max ? items.length - max : 0;
  const d = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      ...style
    }
  }, shown.map((child, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i === 0 ? 0 : -d * 0.3,
      borderRadius: "50%",
      boxShadow: "0 0 0 2px var(--bg-surface)"
    }
  }, React.cloneElement(child, {
    size
  }))), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -d * 0.3,
      width: d,
      height: d,
      borderRadius: "50%",
      background: "var(--secondary-solid)",
      color: "var(--content-secondary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: FONTS[size] - 1,
      boxShadow: "0 0 0 2px var(--bg-surface)",
      boxSizing: "border-box"
    }
  }, "+", extra));
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatCard.jsx
try { (() => {
/** StatCard — KPI tile: label, big value, delta with up/down trend. */
function StatCard({
  label,
  value,
  delta,
  trend,
  icon,
  footnote,
  style = {}
}) {
  const up = trend === "up";
  const trendColor = up ? "var(--up)" : "var(--down)";
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    type: "outlined",
    padding: "md",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--content-tertiary)"
    }
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 8,
      background: "var(--secondary-soft)",
      color: "var(--content-secondary)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 30,
      fontWeight: 600,
      lineHeight: 1,
      color: "var(--content-primary)",
      letterSpacing: "-0.5px"
    }
  }, value), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      fontSize: 13,
      fontWeight: 600,
      color: trendColor
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: up ? "trending_up" : "trending_down",
    size: 16
  }), delta)), footnote && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--content-tertiary)"
    }
  }, footnote));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/display/EmptyState.jsx
try { (() => {
/** EmptyState — zero-data placeholder with icon, title, description and optional CTA. */
function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  size = "md",
  style = {}
}) {
  const large = size === "lg";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: large ? 16 : 12,
      padding: large ? "56px 32px" : "36px 24px",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: large ? 72 : 56,
      height: large ? 72 : 56,
      borderRadius: large ? 20 : 16,
      background: "var(--secondary-soft)",
      color: "var(--content-tertiary)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: large ? 36 : 28,
    weight: 300
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: large ? 18 : 16,
      fontWeight: 600,
      color: "var(--content-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--content-tertiary)",
      maxWidth: 320,
      lineHeight: 1.5
    }
  }, description)), action);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/display/Toolbar.jsx
try { (() => {
/** Toolbar — a row (or column) of icon buttons with optional separators and section groups. */
function Toolbar({
  items = [],
  orientation = "horizontal",
  size = "sm",
  variant = "default",
  style = {}
}) {
  const isVert = orientation === "vertical";
  const border = variant === "bordered";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      flexDirection: isVert ? "column" : "row",
      alignItems: "center",
      gap: 2,
      padding: 6,
      background: "var(--bg-surface)",
      borderRadius: 12,
      boxShadow: border ? "inset 0 0 0 1px var(--border-default)" : "none",
      ...style
    }
  }, items.map((item, i) => {
    if (item === "---") {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          width: isVert ? 20 : 1,
          height: isVert ? 1 : 20,
          background: "var(--border-default)",
          margin: isVert ? "2px 0" : "0 2px"
        }
      });
    }
    return /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
      key: i,
      icon: item.icon,
      variant: item.active ? "secondary" : "ghost",
      size: size,
      "aria-label": item.label,
      disabled: item.disabled,
      onClick: item.onClick
    });
  }));
}
Object.assign(__ds_scope, { Toolbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Toolbar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Banner.jsx
try { (() => {
const TONES = {
  neutral: {
    icon: "info",
    bg: "var(--secondary-soft)",
    border: "var(--border-default)",
    iconColor: "var(--content-secondary)",
    text: "var(--content-primary)"
  },
  info: {
    icon: "info",
    bg: "var(--info-soft)",
    border: "var(--info-border)",
    iconColor: "var(--info-solid)",
    text: "var(--info-on-soft)"
  },
  success: {
    icon: "check_circle",
    bg: "var(--success-soft)",
    border: "var(--success-border)",
    iconColor: "var(--success-solid)",
    text: "var(--success-on-soft)"
  },
  warning: {
    icon: "warning",
    bg: "var(--warning-soft)",
    border: "var(--warning-border)",
    iconColor: "var(--warning-solid)",
    text: "var(--warning-on-soft)"
  },
  danger: {
    icon: "error",
    bg: "var(--danger-soft)",
    border: "var(--danger-border)",
    iconColor: "var(--danger-solid)",
    text: "var(--danger-on-soft)"
  }
};

/** Banner — full-width alert strip. Emphasis: subtle (soft) or strong (solid bg). */
function Banner({
  tone = "info",
  title,
  children,
  onClose,
  emphasis = "subtle",
  style = {}
}) {
  const t = TONES[tone] || TONES.info;
  const solid = emphasis === "strong";
  const solidBg = {
    info: "var(--info-solid)",
    success: "var(--success-solid)",
    warning: "var(--warning-solid)",
    danger: "var(--danger-solid)",
    neutral: "var(--neutral-700)"
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      borderRadius: 12,
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      background: solid ? solidBg[tone] : t.bg,
      boxShadow: solid ? "none" : `inset 0 0 0 1px ${t.border}`,
      color: solid ? "var(--white-100)" : t.text,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 20,
    fill: true,
    color: solid ? "var(--white-100)" : t.iconColor,
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 14
    }
  }, title), children && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      opacity: title ? 0.85 : 1
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    style: {
      flexShrink: 0,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "inherit",
      padding: 2,
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 18
  })));
}

/** InlineMessage — compact inline status hint (no border, text + icon only). */
function InlineMessage({
  tone = "info",
  children,
  style = {}
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      color: t.text,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 16,
    fill: true,
    color: t.iconColor
  }), children);
}
Object.assign(__ds_scope, { Banner, InlineMessage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Banner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback
} = React;
const TONES = {
  neutral: {
    icon: "notifications",
    iconColor: "var(--content-secondary)"
  },
  success: {
    icon: "check_circle",
    iconColor: "var(--success-solid)"
  },
  warning: {
    icon: "warning",
    iconColor: "var(--warning-solid)"
  },
  danger: {
    icon: "error",
    iconColor: "var(--danger-solid)"
  },
  info: {
    icon: "info",
    iconColor: "var(--info-solid)"
  }
};

/** Single Toast item. */
function Toast({
  tone = "neutral",
  title,
  description,
  onClose,
  loading = false,
  style = {}
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      minWidth: 280,
      maxWidth: 380,
      borderRadius: 14,
      background: "var(--bg-raised)",
      boxShadow: "0 4px 24px rgba(10,11,13,0.14), inset 0 0 0 1px var(--border-subtle)",
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }, loading ? /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: "sm"
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 20,
    fill: true,
    color: t.iconColor
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--content-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--content-secondary)",
      marginTop: 2
    }
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--content-tertiary)",
      padding: 2,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 18
  })));
}

/* ── ToastProvider + useToast ──────────────────────────────────────── */
const Ctx = createContext(null);
function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.show;
}
let _uid = 0;
function ToastProvider({
  children
}) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback(({
    tone = "neutral",
    title,
    description,
    duration = 4000,
    loading = false
  } = {}) => {
    const id = ++_uid;
    setToasts(prev => [...prev, {
      id,
      tone,
      title,
      description,
      loading
    }]);
    if (duration && !loading) setTimeout(() => remove(id), duration);
    return id;
  }, []);
  const remove = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return /*#__PURE__*/React.createElement(Ctx.Provider, {
    value: {
      show
    }
  }, children, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "flex-end",
      pointerEvents: "none"
    }
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement(Toast, _extends({}, t, {
    onClose: () => remove(t.id)
  }))))));
}
Object.assign(__ds_scope, { Toast, useToast, ToastProvider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
const SIZES = {
  sm: 16,
  md: 20,
  lg: 24
};

/** Checkbox supporting checked, unchecked and indeterminate. */
function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = "md",
  label,
  description,
  id,
  style = {}
}) {
  const d = SIZES[size] || SIZES.md;
  const on = checked || indeterminate;
  const boxId = id || `cb-${Math.random().toString(36).slice(2, 8)}`;
  const box = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "checkbox",
    id: boxId,
    "aria-checked": indeterminate ? "mixed" : checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      flexShrink: 0,
      width: d,
      height: d,
      borderRadius: 5,
      border: "none",
      padding: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: on ? "var(--primary-solid)" : "var(--bg-surface)",
      boxShadow: on ? "none" : "inset 0 0 0 1.5px var(--border-strong)",
      color: "var(--white-100)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background 120ms ease",
      boxSizing: "border-box"
    }
  }, indeterminate ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "remove",
    size: d - 2,
    weight: 600
  }) : checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: d - 2,
    weight: 700
  }) : null);
  if (!label && !description) return box;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: boxId,
    style: {
      display: "flex",
      alignItems: description ? "flex-start" : "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, box, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: "var(--content-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--content-tertiary)"
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: {
    h: 40,
    font: 14,
    radius: 10,
    pad: 12
  },
  md: {
    h: 48,
    font: 16,
    radius: 12,
    pad: 16
  },
  lg: {
    h: 56,
    font: 16,
    radius: 12,
    pad: 18
  }
};

/** Text input with optional label, helper/error text, and leading/trailing icons. */
function Input({
  label,
  helper,
  error,
  size = "md",
  disabled = false,
  leadingIcon,
  trailingIcon,
  prefix,
  suffix,
  value,
  defaultValue,
  placeholder,
  type = "text",
  onChange,
  style = {},
  id,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const borderColor = error ? "var(--danger-solid)" : focus ? "var(--border-focus)" : "var(--border-default)";
  const fieldId = id || (label ? `in-${Math.random().toString(36).slice(2, 8)}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 13,
      color: "var(--content-secondary)",
      lineHeight: 1.3
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: s.h,
      padding: `0 ${s.pad}px`,
      borderRadius: s.radius,
      background: disabled ? "var(--secondary-soft)" : "var(--bg-surface)",
      boxShadow: `inset 0 0 0 ${focus && !error ? 2 : 1}px ${borderColor}`,
      opacity: disabled ? 0.6 : 1,
      transition: "box-shadow 120ms ease",
      boxSizing: "border-box"
    }
  }, leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    size: 20,
    color: "var(--content-tertiary)"
  }), prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: s.font,
      color: "var(--content-tertiary)"
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    disabled: disabled,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: s.font,
      color: "var(--content-primary)",
      height: "100%"
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: s.font,
      color: "var(--content-tertiary)"
    }
  }, suffix), trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    size: 20,
    color: "var(--content-tertiary)"
  })), (error || helper) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? "var(--danger-on-soft)" : "var(--content-tertiary)",
      lineHeight: 1.3
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const {
  useState,
  useRef,
  useEffect
} = React;
const SIZES = {
  sm: {
    h: 40,
    font: 14,
    radius: 10
  },
  md: {
    h: 48,
    font: 16,
    radius: 12
  },
  lg: {
    h: 56,
    font: 16,
    radius: 12
  }
};

/** Select — custom dropdown. options: [{value,label}] or [string]. */
function Select({
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  label,
  helper,
  error,
  size = "md",
  disabled = false,
  style = {}
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const s = SIZES[size] || SIZES.md;
  const norm = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const selected = norm.find(o => o.value === value);
  useEffect(() => {
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const borderColor = error ? "var(--danger-solid)" : open ? "var(--border-focus)" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      position: "relative",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--content-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: () => !disabled && setOpen(o => !o),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      height: s.h,
      padding: "0 14px 0 16px",
      borderRadius: s.radius,
      border: "none",
      background: disabled ? "var(--secondary-soft)" : "var(--bg-surface)",
      boxShadow: `inset 0 0 0 ${open && !error ? 2 : 1}px ${borderColor}`,
      fontFamily: "var(--font-sans)",
      fontSize: s.font,
      color: selected ? "var(--content-primary)" : "var(--content-tertiary)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      textAlign: "left",
      boxSizing: "border-box",
      transition: "box-shadow 120ms ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, selected ? selected.label : placeholder), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "expand_more",
    size: 20,
    color: "var(--content-tertiary)",
    style: {
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform 150ms ease"
    }
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      right: 0,
      zIndex: 50,
      background: "var(--bg-raised)",
      borderRadius: 12,
      padding: 6,
      boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px var(--border-subtle)",
      maxHeight: 260,
      overflowY: "auto"
    }
  }, norm.map(o => {
    const active = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      type: "button",
      onClick: () => {
        onChange && onChange(o.value);
        setOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "10px 12px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        background: active ? "var(--primary-soft)" : "transparent",
        color: active ? "var(--primary-on-soft)" : "var(--content-primary)",
        fontFamily: "var(--font-sans)",
        fontSize: s.font,
        textAlign: "left"
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = "var(--secondary-soft)";
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = "transparent";
      }
    }, o.label, active && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 18,
      weight: 600
    }));
  })), (error || helper) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? "var(--danger-on-soft)" : "var(--content-tertiary)"
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/marketing/Footer.jsx
try { (() => {
/**
 * Footer — full-width site footer.
 * Columns: array of {title, links: [{label, href}]}
 * Themes: "light" / "dark"
 */
function Footer({
  brand = "Brand",
  tagline = "The complete toolkit to design, build, and ship your product faster.",
  columns = [],
  newsletter = true,
  copyright,
  theme = "light",
  socialLinks = [],
  style = {}
}) {
  const dark = theme === "dark";
  const bg = dark ? "var(--neutral-950)" : "var(--neutral-50)";
  const borderColor = dark ? "var(--neutral-800)" : "var(--border-default)";
  const textColor = dark ? "var(--neutral-300)" : "var(--content-secondary)";
  const mutedColor = dark ? "var(--neutral-500)" : "var(--content-tertiary)";
  const headingColor = dark ? "var(--neutral-50)" : "var(--content-primary)";
  const linkHover = dark ? "var(--white-100)" : "var(--content-primary)";
  const [email, setEmail] = React.useState("");
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: bg,
      borderTop: `1px solid ${borderColor}`,
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      width: "100%",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "48px 48px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 40,
      marginBottom: 40,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "var(--primary-solid)",
      display: "inline-block"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 600,
      color: headingColor
    }
  }, brand)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: textColor,
      lineHeight: 1.5
    }
  }, tagline), socialLinks.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, socialLinks.map((s, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: s.href || "#",
    title: s.label,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: dark ? "var(--neutral-800)" : "var(--neutral-100)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: textColor,
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: s.icon,
    size: 18
  }))))), columns.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 48,
      flexWrap: "wrap"
    }
  }, columns.map((col, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 80
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: headingColor
    }
  }, col.title), (col.links || []).map((link, j) => /*#__PURE__*/React.createElement("a", {
    key: j,
    href: link.href || "#",
    style: {
      fontSize: 14,
      color: mutedColor,
      textDecoration: "none"
    },
    onMouseEnter: e => e.currentTarget.style.color = linkHover,
    onMouseLeave: e => e.currentTarget.style.color = mutedColor
  }, link.label)))))), newsletter && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      marginBottom: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: headingColor,
      marginBottom: 4
    }
  }, "Stay in the loop"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: mutedColor
    }
  }, "Product updates and design tips. No spam.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      height: 48,
      padding: "0 16px",
      borderRadius: 12,
      background: dark ? "var(--neutral-900)" : "var(--white-100)",
      boxShadow: `inset 0 0 0 1px ${borderColor}`,
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "Enter your email",
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontSize: 15,
      fontFamily: "var(--font-sans)",
      color: headingColor
    }
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      height: 48,
      padding: "0 20px",
      borderRadius: 12,
      border: "none",
      background: "var(--primary-solid)",
      color: "var(--white-100)",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: 15,
      cursor: "pointer"
    }
  }, "Subscribe"))), /*#__PURE__*/React.createElement(__ds_scope.Divider, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 0 28px",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: mutedColor
    }
  }, copyright || `© ${new Date().getFullYear()} ${brand} Inc. All rights reserved.`), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      alignItems: "center"
    }
  }, ["Privacy", "Terms", "Cookies"].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontSize: 13,
      color: mutedColor,
      textDecoration: "none"
    },
    onMouseEnter: e => e.currentTarget.style.color = headingColor,
    onMouseLeave: e => e.currentTarget.style.color = mutedColor
  }, l))))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/Footer.jsx", error: String((e && e.message) || e) }); }

// components/marketing/Hero.jsx
try { (() => {
/**
 * Hero — full-width hero section.
 * Types: "hero" (large heading) or "cta" (smaller call-to-action strip).
 * Themes: "light" (white bg) or "dark" (near-black bg).
 */
function Hero({
  type = "hero",
  theme = "light",
  eyebrow,
  heading,
  subtext,
  primaryCta,
  secondaryCta,
  trust,
  style = {}
}) {
  const dark = theme === "dark";
  const bg = dark ? "var(--neutral-950)" : "var(--white-100)";
  const headingColor = dark ? "var(--neutral-50)" : "var(--content-primary)";
  const subtextColor = dark ? "var(--neutral-300)" : "var(--content-secondary)";
  const trustColor = dark ? "var(--neutral-500)" : "var(--content-tertiary)";
  const headingSize = type === "hero" ? 48 : 36;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: bg,
      width: "100%",
      padding: "96px 24px",
      display: "flex",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    color: "primary",
    variant: "soft"
  }, eyebrow)), heading && /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 24px",
      fontFamily: "var(--font-sans)",
      fontWeight: 400,
      fontSize: headingSize,
      lineHeight: 1.1,
      letterSpacing: headingSize >= 44 ? "-1px" : "-0.5px",
      color: headingColor,
      textAlign: "center"
    }
  }, heading), subtext && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 32px",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: 18,
      lineHeight: 1.5,
      color: subtextColor,
      textAlign: "center",
      maxWidth: 640
    }
  }, subtext), (primaryCta || secondaryCta) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: trust ? 20 : 0
    }
  }, primaryCta && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "lg",
    variant: "primary"
  }, primaryCta), secondaryCta && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "lg",
    variant: "outline"
  }, secondaryCta)), trust && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: trustColor,
      textAlign: "center"
    }
  }, trust)));
}
Object.assign(__ds_scope, { Hero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Accordion.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Accordion — items: [{title, children, defaultOpen?}].
 * Styles: default (flat), bordered (card each), card (single card).
 */
function Accordion({
  items = [],
  variant = "default",
  allowMultiple = false,
  style = {}
}) {
  const [open, setOpen] = useState(() => {
    const s = new Set();
    items.forEach((it, i) => {
      if (it.defaultOpen) s.add(i);
    });
    return s;
  });
  const toggle = i => {
    setOpen(prev => {
      const next = new Set(allowMultiple ? prev : []);
      prev.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  const card = variant === "card";
  const bordered = variant === "bordered";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: card ? 0 : bordered ? 8 : 0,
      background: card ? "var(--bg-surface)" : "transparent",
      borderRadius: card ? 14 : 0,
      boxShadow: card ? "inset 0 0 0 1px var(--border-subtle)" : "none",
      overflow: "hidden",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, items.map((item, i) => {
    const isOpen = open.has(i);
    const showDivider = !card && !bordered && i < items.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: bordered ? "var(--bg-surface)" : "transparent",
        borderRadius: bordered ? 12 : 0,
        boxShadow: bordered ? "inset 0 0 0 1px var(--border-subtle)" : "none",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => toggle(i),
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "14px 16px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: 15,
        color: "var(--content-primary)",
        textAlign: "left",
        borderBottom: card && i < items.length - 1 ? "1px solid var(--border-subtle)" : "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, item.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: item.icon,
      size: 20,
      color: "var(--content-secondary)"
    }), item.title), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "expand_more",
      size: 20,
      color: "var(--content-tertiary)",
      style: {
        transform: isOpen ? "rotate(180deg)" : "none",
        transition: "transform 200ms ease"
      }
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 16px 16px",
        fontSize: 14,
        color: "var(--content-secondary)",
        lineHeight: 1.6
      }
    }, item.children), showDivider && /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: "var(--border-subtle)"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
const SEPARATORS = {
  slash: /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--content-tertiary)",
      fontWeight: 300,
      fontSize: 16,
      userSelect: "none"
    }
  }, "/"),
  chevron: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron_right",
    size: 16,
    color: "var(--content-tertiary)"
  }),
  dot: /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: "50%",
      background: "var(--neutral-400)",
      display: "inline-block"
    }
  })
};

/**
 * Breadcrumbs — ordered nav trail.
 * items: [{label, href?, onClick?, icon?}]
 */
function Breadcrumbs({
  items = [],
  separator = "chevron",
  size = "md",
  style = {}
}) {
  const font = size === "sm" ? 13 : size === "lg" ? 16 : 14;
  const sep = SEPARATORS[separator] || SEPARATORS.chevron;
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Breadcrumb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-sans)",
      flexWrap: "wrap",
      ...style
    }
  }, items.map((item, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center"
      }
    }, sep), last ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: font,
        fontWeight: 600,
        color: "var(--content-primary)",
        display: "flex",
        alignItems: "center",
        gap: 5
      }
    }, item.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: item.icon,
      size: font + 2
    }), item.label) : /*#__PURE__*/React.createElement("a", {
      href: item.href || "#",
      onClick: e => {
        if (item.onClick) {
          e.preventDefault();
          item.onClick();
        }
      },
      style: {
        fontSize: font,
        color: "var(--content-secondary)",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 5
      },
      onMouseEnter: e => e.currentTarget.style.color = "var(--content-primary)",
      onMouseLeave: e => e.currentTarget.style.color = "var(--content-secondary)"
    }, item.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: item.icon,
      size: font + 2
    }), item.label));
  }));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
const SIZES_MAP = {
  sm: {
    h: 32,
    font: 13,
    radius: 8
  },
  md: {
    h: 40,
    font: 14,
    radius: 10
  },
  lg: {
    h: 48,
    font: 16,
    radius: 12
  }
};

/** Pagination — prev/next + page buttons. */
function Pagination({
  page = 1,
  total,
  perPage = 10,
  onChange,
  size = "md",
  style = {}
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const s = SIZES_MAP[size] || SIZES_MAP.md;
  const pages_to_show = () => {
    const out = [];
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) out.push(i);
      return out;
    }
    out.push(1);
    if (page > 4) out.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) out.push(i);
    if (page < pages - 3) out.push("…");
    out.push(pages);
    return out;
  };
  const PageBtn = ({
    p,
    disabled: dis
  }) => {
    const active = p === page;
    const [hov, setHov] = React.useState(false);
    if (typeof p !== "number") return /*#__PURE__*/React.createElement("span", {
      style: {
        width: s.h,
        height: s.h,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: s.font,
        color: "var(--content-tertiary)"
      }
    }, "\u2026");
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => !dis && onChange && onChange(p),
      disabled: dis,
      onMouseEnter: () => setHov(true),
      onMouseLeave: () => setHov(false),
      style: {
        width: s.h,
        height: s.h,
        border: active ? "none" : "1px solid var(--border-default)",
        borderRadius: s.radius,
        background: active ? "var(--primary-solid)" : hov && !dis ? "var(--secondary-soft)" : "var(--bg-surface)",
        color: active ? "var(--white-100)" : dis ? "var(--content-disabled)" : "var(--content-primary)",
        fontFamily: "var(--font-sans)",
        fontWeight: active ? 700 : 500,
        fontSize: s.font,
        cursor: dis ? "default" : "pointer",
        transition: "all 100ms ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, p);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement(PageBtn, {
    p: page > 1 ? page - 1 : 1,
    disabled: page === 1
  }), pages_to_show().map((p, i) => /*#__PURE__*/React.createElement(PageBtn, {
    key: i,
    p: p
  })), /*#__PURE__*/React.createElement(PageBtn, {
    p: page < pages ? page + 1 : pages,
    disabled: page === pages
  }));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ProgressTracker.jsx
try { (() => {
const STEP_STATES = {
  complete: {
    bg: "var(--primary-solid)",
    border: "transparent",
    iconName: "check",
    iconColor: "var(--white-100)",
    labelColor: "var(--content-primary)"
  },
  active: {
    bg: "var(--bg-surface)",
    border: "var(--primary-solid)",
    iconColor: "var(--primary-solid)",
    labelColor: "var(--content-primary)"
  },
  todo: {
    bg: "var(--bg-surface)",
    border: "var(--border-default)",
    iconColor: "var(--content-tertiary)",
    labelColor: "var(--content-tertiary)"
  },
  error: {
    bg: "var(--danger-soft)",
    border: "var(--danger-solid)",
    iconName: "close",
    iconColor: "var(--danger-solid)",
    labelColor: "var(--content-primary)"
  }
};
const SIZES_MAP = {
  sm: {
    d: 24,
    icon: 14,
    font: 13
  },
  md: {
    d: 32,
    icon: 18,
    font: 14
  },
  lg: {
    d: 40,
    icon: 22,
    font: 16
  }
};

/** ProgressTracker — multi-step flow indicator. */
function ProgressTracker({
  steps = [],
  current = 0,
  orientation = "horizontal",
  size = "md",
  style = {}
}) {
  const s = SIZES_MAP[size] || SIZES_MAP.md;
  const horiz = orientation === "horizontal";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: horiz ? "row" : "column",
      alignItems: horiz ? "flex-start" : "stretch",
      gap: horiz ? 0 : 0,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, steps.map((step, i) => {
    const state = i < current ? "complete" : i === current ? "active" : "todo";
    const cfg = STEP_STATES[step.state || state];
    const last = i === steps.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: horiz ? "column" : "row",
        alignItems: horiz ? "center" : "flex-start",
        gap: horiz ? 8 : 12,
        flex: horiz && !last ? 1 : undefined
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: horiz ? "row" : "column",
        alignItems: "center",
        width: horiz ? "100%" : undefined
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: s.d,
        height: s.d,
        borderRadius: "50%",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: cfg.bg,
        boxShadow: `inset 0 0 0 2px ${cfg.border}`,
        fontSize: s.icon,
        fontWeight: 700,
        color: cfg.iconColor
      }
    }, cfg.iconName ? /*#__PURE__*/React.createElement("span", {
      className: "material-symbols-rounded",
      style: {
        fontSize: s.icon,
        fontVariationSettings: "'FILL' 0, 'wght' 700"
      }
    }, cfg.iconName) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: s.icon - 2,
        fontWeight: 700,
        color: cfg.iconColor
      }
    }, i + 1)), !last && /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        width: horiz ? undefined : 2,
        height: horiz ? 2 : undefined,
        minWidth: horiz ? 24 : undefined,
        minHeight: horiz ? undefined : 24,
        background: i < current ? "var(--primary-solid)" : "var(--border-default)",
        margin: horiz ? "0 0" : "4px auto",
        alignSelf: "center"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 1,
        paddingBottom: horiz ? 0 : last ? 0 : 24,
        paddingLeft: horiz ? 0 : 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: s.font,
        fontWeight: 600,
        color: cfg.labelColor
      }
    }, step.label), step.description && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: s.font - 2,
        color: "var(--content-tertiary)"
      }
    }, step.description))));
  }));
}
Object.assign(__ds_scope, { ProgressTracker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ProgressTracker.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
/** NavItem — a single sidebar row. */
function NavItem({
  icon,
  label,
  active = false,
  collapsed = false,
  badge,
  onClick,
  disabled = false
}) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? "var(--primary-soft)" : hover && !disabled ? "var(--secondary-soft)" : "transparent";
  const color = disabled ? "var(--content-disabled)" : active ? "var(--primary-on-soft)" : "var(--content-secondary)";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => !disabled && onClick && onClick(),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    title: collapsed ? label : undefined,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: collapsed ? "10px" : "9px 12px",
      justifyContent: collapsed ? "center" : "flex-start",
      border: "none",
      borderRadius: 10,
      background: bg,
      color,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      transition: "background 100ms ease",
      boxSizing: "border-box",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20,
    weight: active ? 500 : 400,
    fill: active
  }), !collapsed && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, label), !collapsed && badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "1px 7px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: active ? "var(--primary-solid)" : "var(--secondary-solid)",
      color: active ? "var(--white-100)" : "var(--content-secondary)"
    }
  }, badge));
}

/** NavSection — uppercase group label. */
function NavSection({
  label,
  collapsed
}) {
  if (collapsed) return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "8px 8px"
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 12px 6px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--content-tertiary)"
    }
  }, label);
}

/**
 * Sidebar — full app navigation rail. header / children / footer slots.
 */
function Sidebar({
  collapsed = false,
  header,
  footer,
  children,
  width = 248,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      display: "flex",
      flexDirection: "column",
      width: collapsed ? 72 : width,
      height: "100%",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border-subtle)",
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      flexShrink: 0,
      transition: "width 160ms ease",
      ...style
    }
  }, header && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: collapsed ? "16px 10px" : "16px",
      boxSizing: "border-box"
    }
  }, header), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: collapsed ? "4px 10px" : "4px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: collapsed ? "12px 10px" : "12px",
      borderTop: "1px solid var(--border-subtle)",
      boxSizing: "border-box"
    }
  }, footer));
}
Object.assign(__ds_scope, { NavItem, NavSection, Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Tabs — items: [{value,label,icon,badge}]. Styles: underline, pill, segmented.
 */
function Tabs({
  items = [],
  value,
  onChange,
  variant = "underline",
  size = "md",
  style = {}
}) {
  const font = size === "sm" ? 14 : 15;
  const pad = size === "sm" ? "8px 12px" : "10px 14px";
  if (variant === "segmented") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "inline-flex",
        padding: 4,
        gap: 4,
        background: "var(--bg-sunken)",
        borderRadius: 12,
        fontFamily: "var(--font-sans)",
        ...style
      }
    }, items.map(t => {
      const on = t.value === value;
      return /*#__PURE__*/React.createElement("button", {
        key: t.value,
        type: "button",
        onClick: () => onChange && onChange(t.value),
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          border: "none",
          borderRadius: 9,
          background: on ? "var(--bg-surface)" : "transparent",
          color: on ? "var(--content-primary)" : "var(--content-tertiary)",
          boxShadow: on ? "0 1px 2px rgba(10,11,13,0.08)" : "none",
          fontFamily: "var(--font-sans)",
          fontWeight: on ? 600 : 500,
          fontSize: font,
          cursor: "pointer",
          transition: "all 120ms ease"
        }
      }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
        name: t.icon,
        size: 18
      }), t.label);
    }));
  }
  const pill = variant === "pill";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: pill ? 8 : 4,
      alignItems: "center",
      borderBottom: pill ? "none" : "1px solid var(--border-default)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, items.map(t => {
    const on = t.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      type: "button",
      onClick: () => onChange && onChange(t.value),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pill ? "8px 14px" : pad,
        border: "none",
        borderRadius: pill ? 999 : 0,
        background: pill ? on ? "var(--primary-soft)" : "transparent" : "transparent",
        color: on ? pill ? "var(--primary-on-soft)" : "var(--content-primary)" : "var(--content-tertiary)",
        borderBottom: pill ? "none" : `2px solid ${on ? "var(--primary-solid)" : "transparent"}`,
        marginBottom: pill ? 0 : -1,
        fontFamily: "var(--font-sans)",
        fontWeight: on ? 600 : 500,
        fontSize: font,
        cursor: "pointer",
        transition: "all 120ms ease"
      }
    }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      size: 18
    }), t.label, t.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 2,
        padding: "1px 7px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: on ? "var(--primary-solid)" : "var(--secondary-solid)",
        color: on ? "var(--white-100)" : "var(--content-secondary)"
      }
    }, t.badge));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Topbar.jsx
try { (() => {
/** Topbar — application header bar. left / center / right slots. */
function Topbar({
  left,
  center,
  right,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      height: 64,
      padding: "0 24px",
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      fontFamily: "var(--font-sans)",
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, left), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "center"
    }
  }, center), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, right));
}

/** SearchField — compact topbar search input. */
function SearchField({
  placeholder = "Search…",
  value,
  onChange,
  width = 280,
  style = {}
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 40,
      width,
      padding: "0 12px",
      borderRadius: 10,
      background: "var(--bg-sunken)",
      boxShadow: focus ? "inset 0 0 0 2px var(--border-focus)" : "inset 0 0 0 1px transparent",
      transition: "box-shadow 120ms ease",
      boxSizing: "border-box",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 20,
    color: "var(--content-tertiary)"
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--content-primary)"
    }
  }));
}
Object.assign(__ds_scope, { Topbar, SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Topbar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Drawer.jsx
try { (() => {
const {
  useEffect
} = React;
const WIDTHS = {
  sm: 320,
  md: 420,
  lg: 560
};

/**
 * Drawer — slides in from left or right. Pass `open`, `onClose`, `title`, optional `footer`.
 */
function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  size = "md",
  style = {}
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  const w = WIDTHS[size] || WIDTHS.md;
  const pos = side === "left" ? {
    left: 0,
    borderRadius: "0 20px 20px 0"
  } : {
    right: 0,
    borderRadius: "20px 0 0 20px"
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => e.target === e.currentTarget && onClose && onClose(),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "var(--bg-overlay)",
      display: "flex",
      justifyContent: side === "left" ? "flex-start" : "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: w,
      maxWidth: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-surface)",
      boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      ...pos,
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px",
      borderBottom: "1px solid var(--border-subtle)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      fontFamily: "var(--font-sans)",
      color: "var(--content-primary)"
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--content-tertiary)",
      padding: 4,
      borderRadius: 8,
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 24
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 24px",
      borderTop: "1px solid var(--border-subtle)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexShrink: 0
    }
  }, footer)));
}
Object.assign(__ds_scope, { Drawer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Drawer.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
const {
  useEffect
} = React;
const SIZES = {
  sm: 400,
  md: 540,
  lg: 680,
  xl: 860
};

/**
 * Modal — portal-like overlay dialog. Sizes: sm/md/lg/xl.
 * Pass `open`, `onClose`, `title`, optional `footer`.
 */
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  style = {}
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  const w = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => e.target === e.currentTarget && onClose && onClose(),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-overlay)",
      padding: 24,
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: "100%",
      maxWidth: w,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-surface)",
      borderRadius: 20,
      boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
      overflow: "hidden",
      boxSizing: "border-box",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px",
      borderBottom: "1px solid var(--border-subtle)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      fontFamily: "var(--font-sans)",
      color: "var(--content-primary)"
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--content-tertiary)",
      padding: 4,
      borderRadius: 8,
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "24px"
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 24px",
      borderTop: "1px solid var(--border-subtle)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexShrink: 0
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Popover.jsx
try { (() => {
const {
  useState,
  useRef,
  useEffect
} = React;
/**
 * Popover — floats a content panel anchored to a trigger, auto-positioned.
 * Use `trigger` (render-prop or element) + `content` (panel body).
 */
function Popover({
  trigger,
  content,
  placement = "bottom",
  open: controlledOpen,
  onOpenChange,
  style = {}
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolled;
  const setOpen = onOpenChange || setUncontrolled;
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const pos = {
    top: {
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    bottom: {
      top: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    left: {
      right: "calc(100% + 8px)",
      top: "50%",
      transform: "translateY(-50%)"
    },
    right: {
      left: "calc(100% + 8px)",
      top: "50%",
      transform: "translateY(-50%)"
    }
  }[placement] || {
    top: "calc(100% + 8px)",
    left: 0
  };
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(!isOpen),
    style: {
      display: "contents",
      cursor: "pointer"
    }
  }, trigger), isOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      ...pos,
      zIndex: 200,
      background: "var(--bg-raised)",
      borderRadius: 14,
      boxShadow: "0 10px 30px rgba(10,11,13,0.12), inset 0 0 0 1px var(--border-subtle)",
      minWidth: 180,
      boxSizing: "border-box"
    }
  }, content));
}

/**
 * DropdownMenu — anchored list of items with icons, labels, separators.
 * items: [{label, icon, onClick, danger, disabled} | "---"]
 */
function DropdownMenu({
  trigger,
  items = [],
  placement = "bottom",
  style = {}
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const pos = {
    bottom: {
      top: "calc(100% + 6px)",
      left: 0
    },
    "bottom-end": {
      top: "calc(100% + 6px)",
      right: 0
    },
    top: {
      bottom: "calc(100% + 6px)",
      left: 0
    }
  }[placement] || {
    top: "calc(100% + 6px)",
    left: 0
  };
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(o => !o),
    style: {
      display: "contents",
      cursor: "pointer"
    }
  }, trigger), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      ...pos,
      zIndex: 200,
      minWidth: 200,
      background: "var(--bg-raised)",
      borderRadius: 12,
      padding: 6,
      boxShadow: "0 10px 30px rgba(10,11,13,0.12), inset 0 0 0 1px var(--border-subtle)",
      fontFamily: "var(--font-sans)"
    }
  }, items.map((item, i) => {
    if (item === "---") return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        height: 1,
        background: "var(--border-subtle)",
        margin: "4px 0"
      }
    });
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      disabled: item.disabled,
      onClick: () => {
        item.onClick?.();
        setOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 10px",
        border: "none",
        borderRadius: 8,
        background: "transparent",
        cursor: item.disabled ? "not-allowed" : "pointer",
        color: item.danger ? "var(--danger-on-soft)" : item.disabled ? "var(--content-disabled)" : "var(--content-primary)",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        textAlign: "left"
      },
      onMouseEnter: e => {
        if (!item.disabled) e.currentTarget.style.background = item.danger ? "var(--danger-soft)" : "var(--secondary-soft)";
      },
      onMouseLeave: e => {
        e.currentTarget.style.background = "transparent";
      }
    }, item.icon && /*#__PURE__*/React.createElement("span", {
      className: "material-symbols-rounded",
      style: {
        fontSize: 18,
        fontVariationSettings: "'FILL' 0, 'opsz' 20"
      }
    }, item.icon), item.label);
  })));
}
Object.assign(__ds_scope, { Popover, DropdownMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Popover.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.AreaChart = __ds_scope.AreaChart;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.Charts = __ds_scope.Charts;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.BadgeCount = __ds_scope.BadgeCount;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.SkeletonLine = __ds_scope.SkeletonLine;

__ds_ns.SkeletonCircle = __ds_scope.SkeletonCircle;

__ds_ns.SkeletonBlock = __ds_scope.SkeletonBlock;

__ds_ns.SkeletonText = __ds_scope.SkeletonText;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Toolbar = __ds_scope.Toolbar;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.InlineMessage = __ds_scope.InlineMessage;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastProvider = __ds_scope.ToastProvider;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Hero = __ds_scope.Hero;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.ProgressTracker = __ds_scope.ProgressTracker;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.NavSection = __ds_scope.NavSection;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Topbar = __ds_scope.Topbar;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Drawer = __ds_scope.Drawer;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Popover = __ds_scope.Popover;

__ds_ns.DropdownMenu = __ds_scope.DropdownMenu;

})();
