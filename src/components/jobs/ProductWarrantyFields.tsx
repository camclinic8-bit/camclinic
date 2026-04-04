'use client';

import { useWatch, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';

type ProductWarrantyFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic `products.${index}.*` paths are incompatible with strict RHF generics in a reusable row component
  control: any;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
};

/**
 * Isolated subscription to has_warranty — avoids parent watch() per product row
 * (which re-rendered the whole products block on every form change).
 */
export function ProductWarrantyFields({ control, index, register, setValue }: ProductWarrantyFieldsProps) {
  const hasWarranty = useWatch({
    control,
    name: `products.${index}.has_warranty`,
    defaultValue: false,
  });

  const wid = `products.${index}.has_warranty`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={`products.${index}.has_warranty`}
          defaultValue={false}
          render={({ field }) => (
            <>
              <input
                type="checkbox"
                id={wid}
                className="rounded border-gray-300"
                checked={!!field.value}
                onChange={(e) => {
                  const checked = e.target.checked;
                  field.onChange(checked);
                  if (!checked) {
                    setValue(`products.${index}.warranty_description`, '', {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue(`products.${index}.warranty_expiry_date`, '', {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
              />
              <label htmlFor={wid} className="text-sm font-medium text-gray-700">
                Has Warranty
              </label>
            </>
          )}
        />
      </div>
      {hasWarranty && (
        <div className="grid md:grid-cols-2 gap-4 pl-5">
          <Input
            label="Warranty Description"
            {...register(`products.${index}.warranty_description`)}
          />
          <Input
            type="date"
            label="Warranty Expiry Date"
            {...register(`products.${index}.warranty_expiry_date`)}
          />
        </div>
      )}
    </div>
  );
}
