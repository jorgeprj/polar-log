import { endOfMonth, startOfMonth } from "date-fns";
import { createClient } from "../supabase/server";


export async function getCarregamentosDashboard(month: Date) {
    const supabase = await createClient();
    
    // Filtramos pelo mês para não sobrecarregar o cliente
    const start = startOfMonth(month).toISOString();
    const end = endOfMonth(month).toISOString();

    const { data, error } = await supabase
        .from('view_detalhe_carregamentos') // Usando a view que criamos no SQL!
        .select(`
            *,
            carregamentos (
                data_carregamento,
                transportadora,
                perfil,
                status
            )
        `)
        .gte('carregamentos.data_carregamento', start)
        .lte('carregamentos.data_carregamento', end);

    if (error) {
        console.error("Erro ao buscar carregamentos:", error);
        return [];
    }

    return data;
}