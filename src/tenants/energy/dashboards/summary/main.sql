SELECT 
  c.id                      AS client_id,
  c.created_at              AS created_at_client,
  cp.id                     AS package_id,
  cp.package_name,
  cp.remaining_classes,
  cp.price,
  cp.expiration_date,
  cp.created_at             AS created_at_package,
  cp.source,
  cp.total_classes
FROM energy.clients c
LEFT JOIN energy.client_packages_client_lnk cpcl ON c.id = cpcl.client_id
LEFT JOIN energy.client_packages cp ON cpcl.client_package_id = cp.id