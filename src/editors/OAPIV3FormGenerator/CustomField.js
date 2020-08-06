import React from 'react';
import CustomSchemaField from './CustomSchemaField';

export function CustomArrayFieldTemplate(props) {

  return (
    <div className={props.className}>
      {props.items &&
      props.items.map(element => (
        <div key={element.key} className={element.className}>
          <div>{element.children}</div>
        </div>
      ))}
    </div>
  );
}

const CustomTitleField = function() {
  return (
    <div/>
  )
}

const CustomDescriptionFields = function() {
  return (
    <div/>
  )
}

export const fields = {
  TitleField: CustomTitleField,
  DescriptionField: CustomDescriptionFields
};

export const fieldsView = {
  TitleField: CustomTitleField,
  DescriptionField: CustomDescriptionFields,
  SchemaField: CustomSchemaField
};
