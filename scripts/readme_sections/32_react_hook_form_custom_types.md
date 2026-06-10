## 38. React Hook Form State Mappings & Type Bindings

This section details the form state variables, registers, default values, and controller bindings for the main forms in the application.

---

### 38.1 Job Intake Form State (`NewJobPage`)

The form state on the **New Job** page maps directly to the Zod validation schemas.

#### 38.1.1 Default Values
Default form values are initialized when the component mounts:
```typescript
defaultValues: {
  priority: 'medium',
  alternative_contact: '',
  spare_parts_total_cost: 0,
  products: [
    { 
      has_warranty: false, 
      accessories: [], 
      other_parts: [], 
      warranty_images: [], 
      product_images: [] 
    }
  ],
  spare_parts_private_details: []
}
```

#### 38.1.2 Controller Bindings & Custom Inputs
We use the `<Controller>` component from React Hook Form to wrap custom components that do not support native ref forwarding:

1. **Accessories Checklist (`AccessoryCheckboxList`)**:
   - **Binding**: Registers changes to accessories array.
   - **Code**:
     ```typescript
     <Controller
       control={control}
       name={`products.${index}.accessories`}
       defaultValue={[]}
       render={({ field }) => (
         <AccessoryCheckboxList
           value={field.value || []}
           onChange={field.onChange}
         />
       )}
     />
     ```

2. **Other Parts Tag Input (`ChipInput`)**:
   - **Binding**: Registers tags entered by pressing Enter or comma.
   - **Code**:
     ```typescript
     <Controller
       control={control}
       name={`products.${index}.other_parts`}
       defaultValue={[]}
       render={({ field }) => (
         <ChipInput
           label="Other Parts"
           value={field.value || []}
           onChange={field.onChange}
           placeholder="Add part, press Enter"
         />
       )}
     />
     ```

---

### 38.2 Job Edit Form State (`EditJobPage`)

The form state on the **Edit Job** page manages status updates and cost calculations.

#### 38.2.1 Real-Time Cost Calculations
The edit form uses React Hook Form's `watch` hook to track changes to charges and update calculations:
```typescript
const inspectionFee = watch('inspection_fee') || 0;
const serviceCharges = watch('service_charges') || 0;
const gstEnabled = watch('gst_enabled');
const advancePaid = watch('advance_paid') || 0;
```
Calculations are updated in real time as the user edits fields:
1. **Subtotal**: Labor + diagnostics + spare parts.
2. **GST**: 18% of labor cost if enabled.
3. **Grand Total**: Subtotal + GST.
4. **Balance Due**: Grand total minus advance payment and transaction ledger entries.
This ensures managers can review estimates before submitting updates to the database.
