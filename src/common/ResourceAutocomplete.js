import { AutoComplete, Select } from 'antd';
import React, { useEffect, useState } from 'react';

export function ResourceAutocomplete(props){
  const [autocomplete, setAutocomplete] = useState([]);

  const autoCompleteSearch = () => {
    setAutocomplete([]);
    window.api.getApis('/').then(res => {
      res.body.groups.forEach(group => {
        window.api.getGenericResource(
          '/apis/' +
          group.preferredVersion.groupVersion
        ).then(_res => {
          let tempRes = [];
          _res.resources.forEach(resource => {
            if(resource.name.split('/').length === 1)
              tempRes.push({
                value: '/apis/' + group.preferredVersion.groupVersion + '/' + resource.name,
                label: resource.name
              })
          });
          setAutocomplete(prev => [...prev, {
            label: group.name,
            options: tempRes
          }])
        })
      })
    }).catch(error => console.log(error))

    window.api.getGenericResource('/api/v1')
      .then(_res => {
        let tempRes = [];
        _res.resources.forEach(resource => {
          if(resource.name.split('/').length === 1)
            tempRes.push({
              value: '/api/v1/' + resource.name,
              label: resource.name
            })
        })
        setAutocomplete(prev => [...prev, {
          label: 'api',
          options: tempRes
        }])
      }).catch(error => console.log(error));
  }

  useEffect(() => {
    window.api.autoCompleteCallback.current = autoCompleteSearch;
    autoCompleteSearch();
  }, []);

  return(
    <div aria-label={'autocompletesearch'}>
      <Select
        filterOption={(inputValue, option) => {
          return option.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
        }}
        allowClear
        showSearch
        size={props.size}
        placeholder="Search resource"
        options={autocomplete}
        onSelect={props.onSearch}
        style={props.style}
      />
    </div>
  )
}
