import React from 'react';

interface PageBreakProps {
  pageNumber: number;
}

export const PageBreak: React.FC<PageBreakProps> = ({ pageNumber }) => {
  return (
    <div className="page-break" data-page={`Page ${pageNumber}`} />
  );
};
