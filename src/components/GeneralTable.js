import React from 'react';

const GeneralTable = ({ data, fields }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-100">
          {fields.map((field) => (
            <th key={field.key} className="p-2 text-left">
              {field.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
            {fields.map((field) => (
              <td key={field.key} className="p-2">
                {field.render ? field.render(item[field.key], item) : item[field.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GeneralTable;

