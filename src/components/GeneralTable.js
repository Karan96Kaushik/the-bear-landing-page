import React from 'react';

const GeneralTable = ({ data, fields, stickyHeader = false, stickyFirstColumn = false, verticalBorders = false }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  const borderClass = verticalBorders ? 'border-r border-gray-200 dark:border-gray-600 last:border-r-0' : '';
  const thBase = 'p-2 text-left border-b dark:border-gray-700';
  const getThClass = (isFirst) => {
    let c = `${thBase} ${borderClass}`;
    if (stickyHeader) c += ' sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)]';
    if (stickyFirstColumn && isFirst) c += ' sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.4)] min-w-0';
    else if (stickyFirstColumn && !isFirst && stickyHeader) c += ' z-10';
    return c;
  };
  const getTdClass = (isFirst) => {
    let c = `p-2 dark:text-white dark:bg-gray-700 ${borderClass}`;
    if (stickyFirstColumn && isFirst) c += ' sticky left-0 z-[1] bg-white dark:bg-gray-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)] min-w-0 hover:bg-gray-300 dark:hover:bg-gray-600';
    return c;
  };
  const stickyHeaderClass = stickyHeader ? '[&>tr]:bg-gray-100 dark:[&>tr]:bg-gray-800' : '';

  const table = (
    <table className="w-full border-collapse rounded-lg">
      <thead className={`hidden md:table-header-group ${stickyHeaderClass}`}>
        <tr className="bg-gray-100 dark:bg-gray-800">
          {fields.map((field, i) => (
            <th key={field.key} className={getThClass(i === 0)}>
              {field.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <React.Fragment key={index}>
            <tr className="md:hidden border-b dark:border-gray-700">
              <td className="block p-4 bg-gray-50 dark:bg-gray-800">
                {fields.map((field) => (
                  <div key={field.key} className="mb-2 last:mb-0 dark:text-white">
                    <span className="font-bold">{field.label}: </span>
                    {field.render ? field.render(item[field.key], item) : item[field.key]}
                  </div>
                ))}
              </td>
            </tr>
            <tr className="hidden md:table-row border-b hover:bg-gray-300 dark:hover:bg-gray-700">
              {fields.map((field, i) => (
                <td key={field.key} className={getTdClass(i === 0)}>
                  {field.render ? field.render(item[field.key], item) : item[field.key]}
                </td>
              ))}
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className={`overflow-x-auto rounded-lg ${stickyHeader ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
      {table}
    </div>
  );
};

export default GeneralTable;
