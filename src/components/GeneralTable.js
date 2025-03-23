import React from 'react';

const GeneralTable = ({ data, fields }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full border-collapse rounded-lg">
        <thead className="hidden md:table-header-group">
          <tr className="bg-gray-100 dark:bg-gray-800">
            {fields.map((field) => (
              <th key={field.key} className="p-2 text-left border-b dark:border-gray-700">
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
                {fields.map((field) => (
                  <td key={field.key} className="p-2 dark:text-white dark:bg-gray-700">
                    {field.render ? field.render(item[field.key], item) : item[field.key]}
                  </td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GeneralTable;
