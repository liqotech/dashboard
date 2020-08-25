import { Space, notification, Button, Table,
Progress, Input, Tag } from 'antd';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import { APP_NAME } from '../constants';
import React from 'react';

/** Return the right color from the percentage given */
export function getColor(percent) {
  if(percent < 70) {
    return '#1890ff';
  } else if (percent >= 70 && percent < 90) {
    return '#faad14';
  } else if (percent >=90) {
    return '#f5222d';
  }
}

/**
 * Search an advertisement from a pool of advertisements
 * @advertisements: the total of advertisements in the cluster
 * @advertisement: the foreign cluster's advertisement
 * @returns true if the advertisement exist and is ACCEPTED, false if not
 * if false it also returns a reason why (the advertisement do not exists,
 * the advertisement is REFUSED or is not ACCEPTED)
 */
export function checkAdvertisement(advertisements, advertisement) {
  let adv = advertisements.find(adv => {return adv.metadata.name === advertisement.name});
  if(adv){
    if(adv.status){
      if(adv.status.advertisementStatus === 'ACCEPTED'){
        return {adv: true}
      } else if(adv.status.advertisementStatus === 'REFUSED'){
        return {adv: false, reason: 'Advertisement Refused'}
      } else {
        return {adv: false, reason: 'Adv. not accepted yet'}
      }
    } else {
      return {adv: false, reason: 'Adv. status not defined'}
    }
  } else {
    return {adv: false, reason: 'Advertisement not present'}
  }
}

/**
 * For now Peering Requests are always accepted, so just check
 * if there is one
 */
export function checkPeeringRequest(peeringRequests, peeringRequest) {
  let pr = peeringRequests.find(pr => {return pr.metadata.name === peeringRequest.name});

  if(pr)
    return true;
}

/** Updates the peering status: CR foreign cluster's joined true or false */
export function updatePeeringStatus(_this, messageOK, messageError) {
  let item = {
    spec: _this.props.foreignCluster.spec
  }

  _this.setState({loading: true});

  let foreignClusterCRD = _this.props.api.getCRDfromKind('ForeignCluster');

  let promise = _this.props.api.updateCustomResource(
    foreignClusterCRD.spec.group,
    foreignClusterCRD.spec.version,
    _this.props.foreignCluster.metadata.namespace,
    foreignClusterCRD.spec.names.plural,
    _this.props.foreignCluster.metadata.name,
    item
  );

  promise
    .then(() => {
      notification.success({
        message: APP_NAME,
        description: messageOK
      });
    })
    .catch(() => {
      notification.error({
        message: APP_NAME,
        description: messageError
      });

      _this.setState({loading: false});
    });
}

export function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
