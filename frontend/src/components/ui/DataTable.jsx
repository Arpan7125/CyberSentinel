import React, { useState } from 'react';
import Pagination from './Pagination';

export default function DataTable({ headers, data, renderRow, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                  No records to display.
                </td>
              </tr>
            ) : (
              pageData.map((item, idx) => renderRow(item, idx + startIndex))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
