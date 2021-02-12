import { Rate } from 'antd';
import React from 'react';
import './FavouriteButton.css';
import { useParams, useLocation } from 'react-router-dom';
import {
  createNewConfig,
  getResourceConfig,
  updateResourceConfig
} from '../DashboardConfigUtils';
import _ from 'lodash';

export default function FavouriteButton(props) {
  let params = useParams();
  let location = useLocation();

  /** Update DashboardConfig with the favourite resource */
  const handleClickResourceListFav = () => {
    if (!_.isEmpty(window.api.dashConfigs.current)) {
      let resourceConfig = getResourceConfig(params, location);

      if (!_.isEmpty(resourceConfig)) {
        /** A config for this resource exists, update it */
        resourceConfig.favourite = !resourceConfig.favourite;
      } else {
        /** A config for this resource does not exists, create one */
        resourceConfig = createNewConfig(params, props, location);
        resourceConfig.favourite = true;
      }

      updateResourceConfig(resourceConfig, params, location);
    }
  };

  /** Update Resource with the 'favourite' annotation */
  const handleClickResourceFav = () => {
    let resource = props.resourceList.find(item => {
      return item.metadata.name === props.resourceName;
    });
    if (
      !resource.metadata.annotations ||
      !resource.metadata.annotations.favourite
    ) {
      resource.metadata.annotations = { favourite: 'true' };
    } else {
      resource.metadata.annotations.favourite = null;
    }
    return window.api
      .updateGenericResource(resource.metadata.selfLink, resource)
      .catch(error => console.error(error));
  };

  return (
    <Rate
      className={props.favourite === 0 ? 'favourite-star' : null}
      count={1}
      value={props.favourite === 1 ? 1 : 0}
      onChange={
        props.list ? handleClickResourceListFav : handleClickResourceFav
      }
      style={
        props.list ? { marginLeft: 10 } : { marginLeft: 0, marginTop: -16 }
      }
    />
  );
}
