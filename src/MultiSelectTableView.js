import { useState } from 'react';
import { useSelector } from 'react-redux';
import colors from './colors';
import { ReactComponent as SortAscending } from './images/sort-ascending.svg';
import { ReactComponent as SortDescending } from './images/sort-descending.svg';
import MultiSelectDropdown from './MultiSelectDropdown';

const getSortedObjects = ({ objects, accessor, sorts, sortReverse }) => {
  if (!accessor) {
    return objects;
  }

  const sortFunction = sorts[accessor];
  const sortedObjects = sortFunction ?
    objects.sort(sortFunction) :
    objects.sort((a, b) => a[accessor] - b[accessor]);

  return sortReverse ? sortedObjects.reverse() : sortedObjects;
};

export default function MultiSelectTableView({
  className,
  columns,
  modifiers = {},
  sorts = {},
  objects,
  selectedObjects,
  setSelectedObjects,
  initialHiddenColumns = [],
}) {
  const maxTableHeight = useSelector((state) => state.preferences.maxTableHeight);
  const useMaxTableHeight = useSelector((state) => state.preferences.useMaxTableHeight);
  const [sortByColumn, setSortByColumn] = useState();
  const [sortReverse, setSortReverse] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState(initialHiddenColumns);
  // TODO filters are used, but nothing actually sets them yet. Add filters to each table
  // column in the header (on a button click), and custom filter functions for supported
  // columns.
  // eslint-disable-next-line no-unused-vars
  const [filters, setFilters] = useState({});

  const updateSelectedObjects = (clickedObject) => {
    if (selectedObjects.includes(clickedObject)) {
      setSelectedObjects(selectedObjects.filter((obj) => obj !== clickedObject));
      return;
    }

    setSelectedObjects(selectedObjects.concat(clickedObject));
  };

  const showingObjects = objects.filter((object) => {
    for (let i = 0; i < columns.length; i++) {
      const accessor = columns[i].accessor;

      if (filters[accessor] && filters[accessor](object[accessor])) {
        return false;
      }
    }

    return true;
  });
  const sortedObjects = getSortedObjects({
    objects: showingObjects,
    accessor: sortByColumn && sortByColumn.accessor,
    sorts,
    sortReverse,
  });
  const showingColumns = columns.filter((column) => !hiddenColumns.includes(column));
  const tableHeightStyle = useMaxTableHeight ? { maxHeight: `${maxTableHeight}px` }: null;

  return (
    <div className={`selectable-table-container ${className}`}>
      <MultiSelectDropdown
        label="Toggle Columns"
        items={columns}
        selected={showingColumns}
        selectItem={({ title }) => setHiddenColumns(
          hiddenColumns.filter((col) => col.title !== title)
        )}
        unselectItem={({ title }) => setHiddenColumns(
          hiddenColumns.concat(columns.find((col) => col.title === title))
        )}
      />
      <div style={tableHeightStyle}>
        <table className="selectable-table">
          <thead>
            <tr>
              {columns.map((column) => {
                if (hiddenColumns.includes(column)) {
                  return null;
                }
                const isSortedAscending = sortByColumn === column && !sortReverse;
                const isSortedDescending = sortByColumn === column && sortReverse;

                return (
                  <th key={column.title}>
                    <div className="flex">
                      <div className="mr-3">{column.title}</div>
                      <div className="ml-auto mt-1">
                        {!hiddenColumns.includes(column) &&
                          <div className="flex space-x-1">
                            <SortAscending
                              className={
                                `cursor-pointer h-3.5 ${
                                  isSortedAscending ? 'selected-green' : ''
                                }`
                              }
                              onClick={() => {
                                if (isSortedAscending) {
                                  setSortByColumn(null);
                                  setSortReverse(false);
                                  return;
                                }

                                setSortByColumn(column);
                                setSortReverse(false);
                              }}
                            />
                            <SortDescending
                              className={
                                `cursor-pointer h-3.5 ${
                                  isSortedDescending ? 'selected-green' : ''
                                }`
                              }
                              onClick={() => {
                                if (isSortedDescending) {
                                  setSortByColumn(null);
                                  setSortReverse(false);
                                  return;
                                }

                                setSortByColumn(column);
                                setSortReverse(true);
                              }}
                            />
                          </div>
                        }
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedObjects.map((object, index) => {
              const selectedIndex = selectedObjects.findIndex(
                (selectedObject) => selectedObject === object);
              const borderColor = selectedIndex !== -1 ?
                colors.label.background[selectedIndex] : '';
              const rowClass = selectedIndex === -1 ? 'unselected' :
                `selected ${borderColor}`;

              return (
                <tr
                  className={rowClass}
                  key={index}
                  onClick={() => updateSelectedObjects(object)}>
                  {columns.map((column, index) => {
                    if (hiddenColumns.includes(column)) {
                      return null;
                    }

                    const accessor = column.accessor;
                    const cellValue = accessor in modifiers ?
                      modifiers[accessor](object[accessor]) :
                      object[accessor];

                    return (
                      <td key={index}>{cellValue}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
