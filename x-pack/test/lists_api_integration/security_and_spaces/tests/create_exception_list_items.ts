/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import type { ExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import { EXCEPTION_LIST_ITEM_URL, EXCEPTION_LIST_URL } from '@kbn/securitysolution-list-constants';
import { getExceptionListItemResponseMockWithoutAutoGeneratedValues } from '../../../../plugins/lists/common/schemas/response/exception_list_item_schema.mock';
import { getCreateExceptionListMinimalSchemaMock } from '../../../../plugins/lists/common/schemas/request/create_exception_list_schema.mock';
import {
  getCreateExceptionListItemMinimalSchemaMock,
  getCreateExceptionListItemMinimalSchemaMockWithoutId,
} from '../../../../plugins/lists/common/schemas/request/create_exception_list_item_schema.mock';
import { FtrProviderContext } from '../../common/ftr_provider_context';

import {
  removeListItemServerGeneratedProperties,
  removeExceptionListItemServerGeneratedProperties,
} from '../../utils';

import { deleteAllExceptions } from '../../utils';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext) => {
  const supertest = getService('supertest');
  const log = getService('log');

  describe('create_exception_list_items', () => {
    describe('validation errors', () => {
      it('should give a 404 error that the exception list must exist first before being able to add a list item to the exception list', async () => {
        const { body } = await supertest
          .post(EXCEPTION_LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListItemMinimalSchemaMock())
          .expect(404);

        expect(body).to.eql({
          message: 'exception list id: "some-list-id" does not exist',
          status_code: 404,
        });
      });
    });

    describe('creating exception list items', () => {
      afterEach(async () => {
        await deleteAllExceptions(supertest, log);
      });

      it('should create a simple exception list item with a list item id', async () => {
        await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        const { body } = await supertest
          .post(EXCEPTION_LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListItemMinimalSchemaMock())
          .expect(200);

        const bodyToCompare = removeExceptionListItemServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(getExceptionListItemResponseMockWithoutAutoGeneratedValues());
      });

      it('should create a simple exception list item without an id', async () => {
        await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        const { body } = await supertest
          .post(EXCEPTION_LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListItemMinimalSchemaMockWithoutId())
          .expect(200);

        const bodyToCompare = removeListItemServerGeneratedProperties(body);
        const outputList: Partial<ExceptionListItemSchema> = {
          ...getExceptionListItemResponseMockWithoutAutoGeneratedValues(),
          item_id: body.item_id,
        };
        expect(bodyToCompare).to.eql(outputList);
      });

      it('should cause a 409 conflict if we attempt to create the same exception list item twice', async () => {
        await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        await supertest
          .post(EXCEPTION_LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListItemMinimalSchemaMock())
          .expect(200);

        const { body } = await supertest
          .post(EXCEPTION_LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListItemMinimalSchemaMock())
          .expect(409);

        expect(body).to.eql({
          message: 'exception list item id: "some-list-item-id" already exists',
          status_code: 409,
        });
      });
    });
  });
};
