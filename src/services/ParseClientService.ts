import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  DELETE_MANY,
} from "react-admin";
import Parse from "parse";

interface ParseClientConfig {
  URL: string;
  APP_ID: string;
  JAVASCRIPT_KEY: string | undefined;
}

const ParseClientService = ({
  URL,
  APP_ID,
  JAVASCRIPT_KEY,
}: ParseClientConfig) => {
  if (!Parse.applicationId || !Parse.javaScriptKey) {
    Parse.initialize(APP_ID, JAVASCRIPT_KEY);
    Parse.serverURL = URL;
  }
  return async (type: string, resource: string, params: any) => {
    const resourceObj = Parse.Object.extend(resource);
    const query = new Parse.Query(resourceObj);
    let subscription = await query.subscribe();
    subscription.on("create", (resourceObj) => {
      console.log(resourceObj);
    });

    switch (type) {
      case GET_LIST: {
        return await handleGetList(params, query);
      }
      case GET_ONE: {
        return await handleGetOne(query, params);
      }
      case GET_MANY: {
        return await handleGetMany(params, resourceObj);
      }
      case GET_MANY_REFERENCE: {
        return await handleGetManyReference(params, query);
      }
      case CREATE: {
        return await handleCreate(params, resourceObj);
      }
      case UPDATE: {
        return await handleUpdate(params, query);
      }
      case UPDATE_MANY: {
        return await handleUpdateMany(params, resourceObj);
      }
      case DELETE: {
        return await handleDelete(params, query);
      }
      case DELETE_MANY: {
        return await handleDeleteMany(params, resourceObj);
      }
    }
  };
};

async function handleGetManyReference(
  params: any,
  query: Parse.Query<Parse.Object<Parse.Attributes>>
) {
  const { page, perPage } = params.pagination;
  const { field, order } = params.sort;
  query.equalTo(params.target, params.id);
  const count = await query.count();
  query.limit(perPage);
  query.skip((page - 1) * perPage);
  if (order === "DESC") query.descending(field);
  else if (order === "ASEC") query.ascending(field);

  const results = await query.find();
  return {
    total: count,
    data: results.map((o) => ({ id: o.id, ...o.attributes })),
  };
}

async function handleGetMany(params: any, resourceObj: any) {
  const results = params.ids.map((id: any) =>
    new Parse.Query(resourceObj).get(id)
  );
  const data = await Promise.all(results);
  return {
    total: data.length,
    data: data.map((o: any) => ({ id: o.id, ...o.attributes })),
  };
}

async function handleGetOne(
  query: Parse.Query<Parse.Object<Parse.Attributes>>,
  params: any
) {
  const result = await query.get(params.id);
  return {
    data: { id: result.id, ...result.attributes },
  };
}

async function handleGetList(
  params: any,
  query: Parse.Query<Parse.Object<Parse.Attributes>>
) {
  const { page, perPage } = params.pagination;
  const { field, order } = params.sort;
  const { filter } = params;

  const count = await query.count();
  query.limit(perPage);
  query.skip((page - 1) * perPage);

  if (order === "DESC") query.descending(field);
  else if (order === "ASEC") query.ascending(field);
  Object.keys(filter).map((f) => query.matches(f, filter[f], "i"));
  const results = await query.find();
  return {
    total: count,
    data: results.map((o) => ({ id: o.id, ...o.attributes })),
  };
}
async function handleCreate(params: any, resourceObj: any) {
  const resObj = new resourceObj();
  // Object.keys(params.data).map(key=>resObj.set(key, params.data[key]));
  try {
    const r = await resObj.save(params.data);
    return { data: { id: r.id, ...r.attributes } };
  } catch (error) {
    return error;
  }
}
async function handleUpdate(
  query: Parse.Query<Parse.Object<Parse.Attributes>>,
  params: any
) {
  try {
    const obj = await query.get(params.id);
    const keys = Object.keys(params.data).filter((o) =>
      o === "id" || o === "createdAt" || o === "updatedAt" ? false : true
    );
    const data = keys.reduce((r: any, f, i) => {
      r[f] = params.data[f];
      return r;
    }, {});
    // console.log(obj);
    const r = await obj.save(data);
    // console.log(r);
    // console.log({data: {id: r.id, ...r.attributes}});
    return { data: { id: r.id, ...r.attributes } };
  } catch (error: any) {
    throw Error(error.toString());
  }
}
async function handleUpdateMany(params: any, resourceObj: any) {
  try {
    const qs = await Promise.all(
      params.ids.map((id: any) => new Parse.Query(resourceObj).get(id))
    );
    qs.map((q: any) => q.save(params.data));
    return { data: params.ids };
  } catch {
    throw Error("Failed to update all");
  }
}
async function handleDelete(
  params: any,
  query: Parse.Query<Parse.Object<Parse.Attributes>>
) {
  try {
    const obj = await query.get(params.id);
    const data = { data: { id: obj.id, ...obj.attributes } };
    await obj.destroy();
    return data;
  } catch (error) {
    throw Error("Unable to delete");
  }
}
async function handleDeleteMany(params: any, resourceObj: any) {
  try {
    const qs = await Promise.all(
      params.ids.map((id: any) => new Parse.Query(resourceObj).get(id))
    );
    await Promise.all(qs.map((obj: any) => obj.destroy()));
    return { data: params.ids };
  } catch (error) {
    throw Error("Unable to delete all");
  }
}

export default ParseClientService;
