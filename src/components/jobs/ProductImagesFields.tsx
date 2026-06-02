'use client';

import { useWatch, Controller } from 'react-hook-form';
import { useState, useRef } from 'react';
import { compressImage } from '@/lib/utils/imageCompression';
import { toast } from 'sonner';
import { Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';

type ProductImagesFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
};

export function ProductImagesFields({ control, index, setValue }: ProductImagesFieldsProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productImages = useWatch({
    control,
    name: `products.${index}.product_images`,
    defaultValue: [] as string[],
  }) || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (productImages.length + files.length > 8) {
      toast.error('Maximum of 8 photos allowed per product');
      return;
    }

    setIsCompressing(true);
    try {
      const compressed: string[] = [];
      for (const file of files) {
        // Compress recursively to under 50kb
        const base64 = await compressImage(file, 50);
        compressed.push(base64);
      }
      setValue(`products.${index}.product_images`, [...productImages, ...compressed], {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success(`${files.length} product photo(s) added and compressed under 50kb successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to compress or upload one or more product photos');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imgIndex: number) => {
    const updated = productImages.filter((_: string, idx: number) => idx !== imgIndex);
    setValue(`products.${index}.product_images`, updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success('Product photo removed');
  };

  return (
    <div className="space-y-2 pt-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Product Photos ({productImages.length}/8)
      </label>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Image previews */}
        {productImages.map((img: string, imgIdx: number) => (
          <div
            key={imgIdx}
            className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`Product preview ${imgIdx + 1}`}
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
        {productImages.length < 8 && (
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
        Upload up to 8 photos. High-performance auto-compression under 50kb is applied instantly.
      </p>
    </div>
  );
}
