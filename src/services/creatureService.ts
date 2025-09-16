import { supabase } from '@/lib/supabase'

export interface DatabaseCreature {
  id: string
  user_id: string
  name: string
  image_url?: string
  generation_params: any
  traits: any
  is_favorite: boolean
  is_public: boolean
  rating?: number
  created_at: string
  updated_at: string
}

export class CreatureService {
  // Get all creatures for the current user
  static async getUserCreatures(userId: string): Promise<DatabaseCreature[]> {
    const { data, error } = await supabase
      .from('creatures')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user creatures:', error)
      throw error
    }

    return data || []
  }

  // Get public creatures (for community gallery)
  static async getPublicCreatures(): Promise<DatabaseCreature[]> {
    const { data, error } = await supabase
      .from('creatures')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to 50 most recent public creatures

    if (error) {
      console.error('Error fetching public creatures:', error)
      throw error
    }

    return data || []
  }

  // Save a new creature
  static async saveCreature(
    userId: string,
    creatureData: {
      name: string
      image_url?: string
      generation_params: any
      traits: any
      is_favorite?: boolean
      is_public?: boolean
      rating?: number
    }
  ): Promise<DatabaseCreature> {
    const { data, error } = await supabase
      .from('creatures')
      .insert({
        user_id: userId,
        ...creatureData,
        is_favorite: creatureData.is_favorite || false,
        is_public: creatureData.is_public || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving creature:', error)
      throw error
    }

    return data
  }

  // Update an existing creature
  static async updateCreature(
    creatureId: string,
    updates: Partial<Omit<DatabaseCreature, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<DatabaseCreature> {
    const { data, error } = await supabase
      .from('creatures')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', creatureId)
      .select()
      .single()

    if (error) {
      console.error('Error updating creature:', error)
      throw error
    }

    return data
  }

  // Delete a creature
  static async deleteCreature(creatureId: string): Promise<void> {
    const { error } = await supabase
      .from('creatures')
      .delete()
      .eq('id', creatureId)

    if (error) {
      console.error('Error deleting creature:', error)
      throw error
    }
  }

  // Toggle favorite status
  static async toggleFavorite(creatureId: string, isFavorite: boolean): Promise<DatabaseCreature> {
    return this.updateCreature(creatureId, { is_favorite: isFavorite })
  }

  // Update creature rating
  static async updateRating(creatureId: string, rating: number): Promise<DatabaseCreature> {
    return this.updateCreature(creatureId, { rating })
  }

  // Rename creature
  static async renameCreature(creatureId: string, name: string): Promise<DatabaseCreature> {
    return this.updateCreature(creatureId, { name })
  }

  // Toggle public visibility
  static async togglePublic(creatureId: string, isPublic: boolean): Promise<DatabaseCreature> {
    return this.updateCreature(creatureId, { is_public: isPublic })
  }

  // Migrate localStorage creatures to database
  static async migrateLocalStorageCreatures(userId: string): Promise<number> {
    try {
      const localData = localStorage.getItem('createosaur-creatures')
      if (!localData) return 0

      const localCreatures = JSON.parse(localData)
      if (!Array.isArray(localCreatures) || localCreatures.length === 0) return 0

      let migratedCount = 0

      for (const creature of localCreatures) {
        try {
          await this.saveCreature(userId, {
            name: creature.name || 'Unnamed Creature',
            image_url: creature.imageUrl || creature.image_url,
            generation_params: creature.generationParams || creature.generation_params || {},
            traits: creature.traits || {},
            is_favorite: creature.isFavorite || creature.is_favorite || false,
            is_public: false, // Keep migrated creatures private by default
            rating: creature.rating
          })
          migratedCount++
        } catch (err) {
          console.warn('Failed to migrate creature:', creature, err)
        }
      }

      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.removeItem('createosaur-creatures')
      }

      return migratedCount
    } catch (err) {
      console.error('Error during migration:', err)
      return 0
    }
  }
}