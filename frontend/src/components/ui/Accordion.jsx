import React, { useState } from 'react';

export function AccordionItem({ question, answer, isOpen, onToggle, id }) {
  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <button
        className="accordion-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${id}`}
        id={`accordion-header-${id}`}
      >
        <span className="accordion-question">{question}</span>
        <span className={`accordion-chevron ${isOpen ? 'rotated' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>
      <div
        className={`accordion-panel ${isOpen ? 'expanded' : ''}`}
        id={`accordion-panel-${id}`}
        role="region"
        aria-labelledby={`accordion-header-${id}`}
      >
        <div className="accordion-answer">{answer}</div>
      </div>
    </div>
  );
}

export default function Accordion({ items, allowMultiple = false }) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    setOpenItems(prev => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="accordion" role="region">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          id={i}
          question={item.question}
          answer={item.answer}
          isOpen={openItems.has(i)}
          onToggle={() => toggleItem(i)}
        />
      ))}
    </div>
  );
}
