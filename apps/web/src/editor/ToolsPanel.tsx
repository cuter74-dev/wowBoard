import { useState } from 'react';
import { AiPanel } from './AiPanel';
import { TemplatePicker } from './TemplatePicker';

/** Collapsible bottom section of the right rail: AI assistant + templates. */
export function ToolsPanel() {
  const [open, setOpen] = useState(true);
  return (
    <div className={`tools-panel ${open ? 'open' : ''}`}>
      <button className="tools-header" onClick={() => setOpen((o) => !o)}>
        <span>AI · 템플릿</span>
        <span>{open ? '▾' : '▴'}</span>
      </button>
      {open && (
        <div className="tools-body">
          <AiPanel />
          <TemplatePicker />
        </div>
      )}
    </div>
  );
}
