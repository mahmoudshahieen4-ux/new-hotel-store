'use client';

import { useActionState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { actionFunction } from '@/utils/types';

const initialState = {
  message: '',
};

function FormContainer({
  action,
  children,
}: {
  action: actionFunction;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const { toast } = useToast();
  useEffect(() => {
    if (state.message) {
      const msg = state.message.toLowerCase();
      const isError = !/success|removed|updated|submitted|added to faves/i.test(msg);
      toast({
        variant: isError ? "destructive" : "default",
        description: state.message,
      });
    }
  }, [state, toast]);
  return <form action={formAction}>{children}</form>;
}
export default FormContainer;
