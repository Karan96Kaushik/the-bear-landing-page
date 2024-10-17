import React from 'react';

const GeneralTable = ({ data, fields }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="hidden md:table-header-group">
          <tr className="bg-gray-100">
            {fields.map((field) => (
              <th key={field.key} className="p-2 text-left border-b">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <React.Fragment key={index}>
              <tr className="md:hidden border-b">
                <td className="block p-4 bg-gray-50">
                  {fields.map((field) => (
                    <div key={field.key} className="mb-2 last:mb-0">
                      <span className="font-bold">{field.label}: </span>
                      {field.render ? field.render(item[field.key], item) : item[field.key]}
                    </div>
                  ))}
                </td>
              </tr>
              <tr className="hidden md:table-row border-b">
                {fields.map((field) => (
                  <td key={field.key} className="p-2">
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
