-- INNER JOIN (matched only)
SELECT c.customer_id, o.order_id, o.order_amount
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id;

-- LEFT JOIN (all customers)
SELECT c.customer_id, o.order_id, o.order_amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;

-- FULL OUTER JOIN (all records)
SELECT c.customer_id, o.order_id, o.order_amount
FROM customers c
FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;
