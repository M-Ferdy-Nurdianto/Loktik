alter table public.orders
add column if not exists payment_method varchar(50);

comment on column public.orders.payment_method is 'Buyer payment method: Transfer Bank, QRIS, or CASH';

update public.orders
set payment_method = case
  when upper(coalesce(guest_name, '')) like 'OTS%QRIS%' then 'QRIS'
  when upper(coalesce(guest_name, '')) like 'OTS%CASH%' then 'CASH'
  else payment_method
end
where coalesce(payment_method, '') = '';
