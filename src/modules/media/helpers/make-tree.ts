export function makeTreeFolder(
  data: {
    _id: string;
    name: string;
    nameSort: string;
    parent: string;
    [key: string]: any;
  }[],
) {
  const children: any[] = [];
  const map: any = new Map(
    (data as any).map(({ name, _id, parent, nameSort }) => [
      _id,
      { _id, name, nameSort, parent },
    ]),
  ).set(null, { children });

  for (const { _id, name, nameSort, parent } of data) {
    const parentData = map.get(parent) || map.get(null);
    (parentData.children ??= []).push(
      _id ? map.get(_id) : { _id, name, nameSort, parent },
    );
  }

  return children;
}
