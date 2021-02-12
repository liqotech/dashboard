import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import Utils from '../services/Utils';

export function ResourceAutocomplete(props) {
  const [autocomplete, setAutocomplete] = useState([]);

  const autoCompleteSearch = () => {
    window.api
      .getApis('/')
      .then(res => {
        res.body.groups.forEach(group => {
          group.versions.forEach(version => {
            window.api
              .getGenericResource('/apis/' + version.groupVersion)
              .then(_res => {
                let tempRes = [];
                _res.resources.forEach(resource => {
                  if (resource.name.split('/').length === 1)
                    tempRes.push({
                      value:
                        '/apis/' + version.groupVersion + '/' + resource.name,
                      label: resource.name
                    });
                });
                setAutocomplete(prev => {
                  if (
                    !prev.find(item =>
                      Utils().arraysEqual(item.options, tempRes)
                    )
                  )
                    return [
                      ...prev,
                      {
                        label: version.groupVersion,
                        options: tempRes
                      }
                    ];
                  else return prev;
                });
              })
              .catch(error => console.log(error));
          });
        });
      })
      .catch(error => console.log(error));

    window.api
      .getGenericResource('/api/v1')
      .then(_res => {
        let tempRes = [];
        _res.resources.forEach(resource => {
          if (resource.name.split('/').length === 1)
            tempRes.push({
              value: '/api/v1/' + resource.name,
              label: resource.name
            });
        });
        setAutocomplete(prev => {
          if (!prev.find(item => Utils().arraysEqual(item.options, tempRes)))
            return [
              ...prev,
              {
                label: 'api',
                options: tempRes
              }
            ];
          else return prev;
        });
      })
      .catch(error => console.log(error));
  };

  useEffect(() => {
    window.api.autoCompleteCallback.current.push(autoCompleteSearch);
    autoCompleteSearch();

    return () => {
      window.api.autoCompleteCallback.current = window.api.autoCompleteCallback.current.filter(
        cb => cb !== autoCompleteSearch
      );
    };
  }, []);

  return (
    <div aria-label={'autocompletesearch'}>
      <Select
        filterOption={(inputValue, option) => {
          return (
            option.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          );
        }}
        mode={props.multiple ? 'multiple' : null}
        onDeselect={props.onDeselect}
        allowClear
        showSearch
        size={props.size}
        placeholder="Search resource"
        options={autocomplete}
        onSelect={props.onSearch}
        style={props.style}
      />
    </div>
  );
}
