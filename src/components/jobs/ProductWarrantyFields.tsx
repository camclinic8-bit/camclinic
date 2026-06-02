'use client';

import { useWatch, Controller } from 'react-hook-form';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { compressImage } from '@/lib/utils/imageCompression';
import { toast } from 'sonner';
import { Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';

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
 */
export function ProductWarrantyFields({ control, index, register, setValue }: ProductWarrantyFieldsProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasWarranty = useWatch({
    control,
    name: `products.${index}.has_warranty`,
    defaultValue: false,
  });

  const warrantyImages = useWatch({
    control,
    name: `products.${index}.warranty_images`,
    defaultValue: [] as string[],
  }) || [];

  const wid = `products.${index}.has_warranty`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (warrantyImages.length + files.length > 5) {
      toast.error('Maximum of 5 photos allowed per product warranty');
      return;
    }

    setIsCompressing(true);
    try {
      const compressed: string[] = [];
      for (const file of files) {
        const base64 = await compressImage(file);
        compressed.push(base64);
      }
      setValue(`products.${index}.warranty_images`, [...warrantyImages, ...compressed], {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(`${files.length} photo(s) added and compressed successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to compress or upload one or more photos');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imgIndex: number) => {
    const updated = warrantyImages.filter((_: string, idx: number) => idx !== imgIndex);
    setValue(`products.${index}.warranty_images`, updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success('Photo removed');
  };

  return (
    <div className="space-y-4">
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
                className="rounded border-gray-300 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
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
                    setValue(`products.${index}.warranty_images`, [], {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
              />
              <label htmlFor={wid} className="text-sm font-semibold text-gray-700 select-none cursor-pointer">
                Has Warranty
              </label>
            </>
          )}
        />
      </div>

      {hasWarranty && (
        <div className="space-y-4 pl-5 border-l-2 border-emerald-100 dark:border-emerald-900/40">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Warranty Description"
              {...register(`products.${index}.warranty_description`)}
              placeholder="e.g. Sony India 2 Year Official Warranty"
            />
            <Input
              type="date"
              label="Warranty Expiry Date"
              {...register(`products.${index}.warranty_expiry_date`)}
            />
          </div>

          {/* Warranty Images Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Warranty Photos ({warrantyImages.length}/5)
            </label>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Image previews */}
              {warrantyImages.map((img: string, imgIdx: number) => (
                <div
                  key={imgIdx}
                  className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Warranty preview ${imgIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imgIdx)}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-transform scale-75 group-hover:scale-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload trigger */}
              {warrantyImages.length < 5 && (
                <button
                  type="button"
                  disabled={isCompressing}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-emerald-500 transition-colors focus:outline-none disabled:opacity-50"
                >
                  {isCompressing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              Upload up to 5 photos. High-performance auto-compression under 100kb is applied instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
