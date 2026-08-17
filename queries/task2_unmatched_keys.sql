-- Customers with NO orders
SELECT c.customer_id, c.customer_type, c.signup_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL
ORDER BY c.signup_date;

-- Orders with NO matching customer (orphaned records)
SELECT o.order_id, o.customer_id, o.order_date
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL
ORDER BY o.order_date;
