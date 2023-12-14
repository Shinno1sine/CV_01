export function makeTree(
  data: {
    _id: string;
    parent: string;
    [key: string]: any;
  }[],
) {
  const children: any[] = [];
  const map: any = new Map(
    (data as any).map((item) => [item._id, { ...item }]),
  ).set(null, { children });

  for (const item of data) {
    const parentData = map.get(item.parent) || map.get(null);
    (parentData.children ??= []).push(
      item?._id ? map.get(item?._id) : { ...item },
    );
  }

  return children;
}
