import "./BarChart.css";

/**
 * BarChart.jsx
 *
 * A small, dependency-free horizontal bar chart. Renders one row per data
 * point: a label, a bar scaled relative to the largest value in the set,
 * and the formatted value. Deliberately simple — this is for "orders by
 * shop" / "revenue by shop" style comparisons, not a general charting
 * library, so it only needs to do one thing well.
 *
 * data: [{ label, value }], already sorted the way you want them shown.
 * color: a CSS color value (usually one of the design tokens) for the bars.
 * formatValue: (value) => string, defaults to the raw number.
 */
export default function BarChart({ data, color = "var(--indigo-500)", formatValue = (v) => v }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1); // avoid divide-by-zero when everything is 0

  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div className="bar-chart-row" key={d.label}>
          <span className="bar-chart-label" title={d.label}>{d.label}</span>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ width: `${(d.value / maxValue) * 100}%`, background: color }}
            />
          </div>
          <span className="bar-chart-value">{formatValue(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
