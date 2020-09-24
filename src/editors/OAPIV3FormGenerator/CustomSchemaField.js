import React, { useEffect, useRef, useState } from 'react';

const COMPONENT_TYPES = {
  array: "ArrayField",
  boolean: "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  null: "NullField",
};

let utils = require('@rjsf/core/lib/utils');

function getFieldComponent(schema, uiSchema, idSchema, fields) {
  const field = uiSchema["ui:field"];

  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }

  const componentName = COMPONENT_TYPES[utils.getSchemaType(schema)];

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  return componentName in fields
    ? fields[componentName]
    : () => {
      const { UnsupportedField } = fields;

      return (
        <UnsupportedField
          schema={schema}
          idSchema={idSchema}
          reason={`Unknown field type ${schema.type}`}
        />
      );
    };
}

function SchemaFieldRender(props, _disabled, onDisableChange) {
  const {
    uiSchema,
    formData,
    errorSchema,
    idPrefix,
    name,
    onKeyChange,
    onDropPropertyClick,
    required,
    registry = utils.getDefaultRegistry(),
    wasPropertyKeyModified = false,
  } = props;
  const { rootSchema, fields, formContext } = registry;
  const FieldTemplate =
    uiSchema["ui:FieldTemplate"] || registry.FieldTemplate /*|| DefaultTemplate*/;
  let idSchema = props.idSchema;
  const schema = utils.retrieveSchema(props.schema, rootSchema, formData);
  idSchema = utils.mergeObjects(
    utils.toIdSchema(schema, null, rootSchema, formData, idPrefix),
    idSchema
  );
  const FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
  const { DescriptionField } = fields;
  const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  const readonly = Boolean(
    props.readonly ||
    uiSchema["ui:readonly"] ||
    props.schema.readOnly ||
    schema.readOnly
  );
  const autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  const displayLabel = utils.getDisplayLabel(schema, uiSchema, rootSchema);

  const { __errors, ...fieldErrorSchema } = errorSchema;

  // See #439: uiSchema: Don't pass consumed class names to child components
  const field = (
    <FieldComponent
      {...props}
      idSchema={idSchema}
      schema={schema}
      uiSchema={{ ...uiSchema, classNames: undefined }}
      disabled={_disabled}
      readonly={readonly}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema}
      formContext={formContext}
      rawErrors={__errors}
    />
  );

  const { type } = schema;
  const id = idSchema.$id;

  // If this schema has a title defined, but the user has set a new key/label, retain their input.
  let label;
  if (wasPropertyKeyModified) {
    label = name;
  } else {
    label = uiSchema["ui:title"] || props.schema.title || schema.title || name;
  }

  const description =
    uiSchema["ui:description"] ||
    props.schema.description ||
    schema.description;
  const errors = __errors;
  const help = uiSchema["ui:help"];
  const hidden = uiSchema["ui:widget"] === "hidden";
  const classNames = [
    "form-group",
    "field",
    `field-${type}`,
    errors && errors.length > 0 ? "field-error has-error has-danger" : "",
    uiSchema.classNames,
  ]
    .join(" ")
    .trim();

  const fieldProps = {
    description: (
      <DescriptionField
        id={id + "__description"}
        description={description}
        formContext={formContext}
      />
    ),
    rawDescription: description,
    rawErrors: errors,
    id,
    label,
    hidden,
    onDisableChange,
    onKeyChange,
    onDropPropertyClick,
    required,
    disabled: _disabled,
    readonly,
    displayLabel,
    classNames,
    formContext,
    fields,
    schema,
    uiSchema,
    registry,
  };

  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;

  return (
    <FieldTemplate {...fieldProps}>
      <React.Fragment>
        {field}

        {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
        {schema.anyOf && !utils.isSelect(schema) && (
          <_AnyOfField
            disabled={disabled}
            errorSchema={errorSchema}
            formData={formData}
            idPrefix={idPrefix}
            idSchema={idSchema}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.anyOf}
            baseType={schema.type}
            registry={registry}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}

        {schema.oneOf && !utils.isSelect(schema) && (
          <_OneOfField
            disabled={disabled}
            errorSchema={errorSchema}
            formData={formData}
            idPrefix={idPrefix}
            idSchema={idSchema}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.oneOf}
            baseType={schema.type}
            registry={registry}
            schema={schema}
            uiSchema={uiSchema}
          />
        )}
      </React.Fragment>
    </FieldTemplate>
  );
}

function CustomSchemaField(props) {

  const [disabled, setDisabled] = useState(true);
  const originalValue = useRef('');

  useEffect(() => {
    if(props.schema.type !== 'object' && props.schema.type !== 'array'){
      originalValue.current = props.formData;
    }
  }, [])

  const onDisableChange = () => {
    setDisabled(prev => !prev);
    props.onChange(originalValue.current);
  }

  return SchemaFieldRender(props, disabled, onDisableChange);
}

CustomSchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false,
};

export default CustomSchemaField;
